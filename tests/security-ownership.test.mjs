import './fixtures/jwt.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createCasesRouter } from '../routes/cases.js';
import { createClientsRouter } from '../routes/clients.js';
import { createInquiriesRouter } from '../routes/inquiries.js';
import { createTeamRouter } from '../routes/team.js';
import { createPaymentsRouter } from '../routes/payments.js';
import { createCsvRouter } from '../routes/csvUploadRoute.js';
import { assignOrphans } from '../scripts/assign-orphan-records.mjs';

const A = '0000000000000000000000aa', B = '0000000000000000000000bb';
let serial = 0;
const nextId = () => (++serial).toString(16).padStart(24, '0');

// In-memory stand-in for a Mongoose model: equality filters on every key.
function repo() {
  const rows = [];
  const match = (row, q) => Object.entries(q).every(([k, v]) => String(row[k]) === String(v));
  const query = value => Object.assign(Promise.resolve(value), { sort() { return query(value); }, lean() { return Promise.resolve(value); } });
  return { rows,
    async create(doc) { const row = { _id: nextId(), ...doc }; rows.push(row); return row; },
    async insertMany(docs) { return Promise.all(docs.map(d => this.create(d))); },
    find(q) { return query(rows.filter(r => match(r, q))); },
    async findOne(q) { return rows.find(r => match(r, q)) || null; },
    async findOneAndUpdate(q, update) { const row = rows.find(r => match(r, q)); if (row) Object.assign(row, update.$set); return row || null; },
    async findOneAndDelete(q) { const i = rows.findIndex(r => match(r, q)); return i < 0 ? null : rows.splice(i, 1)[0]; },
  };
}

// Simulates the API guard: req.user comes only from the (already verified) identity.
async function serve(mount, router, run) {
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { const id = req.headers['x-verified-user']; if (id) req.user = { id }; next(); });
  app.use(mount, router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  try { await run('http://127.0.0.1:' + server.address().port + mount); } finally { await new Promise(r => server.close(r)); }
}
const as = (user, base) => async (path, { method = 'GET', body } = {}) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-verified-user': user }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('cases: owner comes from the session; other users cannot read, edit or delete', async () => {
  const cases = repo();
  await serve('/api/cases', createCasesRouter({ cases }), async base => {
    const a = as(A, base), b = as(B, base);
    const created = await a('/add', { method: 'POST', body: { userId: B, caseName: 'A v. State', courtName: 'HC', hearingDate: '2026-12-01' } });
    assert.equal(created.status, 201); assert.equal(String(cases.rows[0].userId), A, 'body userId must be ignored');
    const id = cases.rows[0]._id;
    assert.equal((await b('/user/' + A)).body.cases.length, 0, 'URL userId must be ignored');
    assert.equal((await a('/user/' + B)).body.cases.length, 1);
    assert.equal((await b('/' + id)).status, 404);
    assert.equal((await b('/' + id, { method: 'PUT', body: { caseName: 'hijack' } })).status, 404);
    assert.equal((await b('/' + id, { method: 'DELETE' })).status, 404);
    assert.equal(cases.rows[0].caseName, 'A v. State');
    const upd = await a('/' + id, { method: 'PUT', body: { caseName: 'Renamed', userId: B, _id: 'x', status: 'Closed' } });
    assert.equal(upd.status, 200); assert.equal(cases.rows[0].caseName, 'Renamed'); assert.equal(String(cases.rows[0].userId), A); assert.equal(cases.rows[0]._id, id);
    assert.equal((await a('/' + id, { method: 'PUT', body: { caseName: { $set: 'x' } } })).status, 400);
    assert.equal((await a('/not-an-id')).status, 400);
    assert.equal((await b('/import', { method: 'POST', body: { userId: A, textData: 'Case No: 12/2026\nX Vs Y\nCourt: HC' } })).status, 201);
    assert.equal(String(cases.rows.at(-1).userId), B);
    assert.equal((await a('/' + id, { method: 'DELETE' })).status, 200);
  });
});

test('clients: list, add and delete are limited to the owner', async () => {
  const clients = repo();
  await serve('/api/clients', createClientsRouter({ clients }), async base => {
    const a = as(A, base), b = as(B, base);
    await a('/add', { method: 'POST', body: { userId: B, name: 'Client A', phone: '1' } });
    assert.equal(String(clients.rows[0].userId), A);
    assert.equal((await b('/user/' + A)).body.clients.length, 0);
    assert.equal((await b('/' + clients.rows[0]._id, { method: 'DELETE' })).status, 404);
    assert.equal(clients.rows.length, 1);
    assert.equal((await a('/' + clients.rows[0]._id, { method: 'DELETE' })).status, 200);
  });
});

test('inquiries: no longer global; each user sees and changes only their own', async () => {
  const inquiries = repo();
  await serve('/api/inquiries', createInquiriesRouter({ inquiries }), async base => {
    const a = as(A, base), b = as(B, base);
    await a('/', { method: 'POST', body: { inquirerName: 'P', contactNumber: '9', userId: B } });
    await b('/', { method: 'POST', body: { inquirerName: 'Q', contactNumber: '8' } });
    assert.deepEqual((await a('/')).body.map(r => r.inquirerName), ['P']);
    assert.deepEqual((await b('/')).body.map(r => r.inquirerName), ['Q']);
    const id = inquiries.rows[0]._id;
    for (const [method, body] of [['GET'], ['PUT', { summary: 'x' }], ['DELETE']]) assert.equal((await b('/' + id, { method, body })).status, 404);
    assert.equal(inquiries.rows.length, 2);
  });
});

test('team and payments: scoped to the owner; spoofed userId ignored', async () => {
  const members = repo(), payments = repo();
  await serve('/api/team', createTeamRouter({ members }), async base => {
    await as(A, base)('/', { method: 'POST', body: { fullName: 'Junior', email: 'j@example.test', userId: B } });
    assert.equal(String(members.rows[0].userId), A);
    assert.equal((await as(B, base)('/')).body.length, 0);
    assert.equal((await as(A, base)('/')).body.length, 1);
  });
  await serve('/api/payments', createPaymentsRouter({ payments }), async base => {
    const created = await as(A, base)('/', { method: 'POST', body: { date: '2026-11-01', client: 'X', amount: '5000', type: 'Income', userId: B } });
    assert.equal(created.status, 201); assert.equal(String(payments.rows[0].userId), A); assert.equal(payments.rows[0].amount, 5000);
    assert.equal((await as(B, base)('/')).body.payments.length, 0);
    assert.equal((await as(A, base)('/')).body.payments.length, 1);
    assert.equal((await as(A, base)('/', { method: 'POST', body: { date: '2026-11-01', client: 'X', amount: -1, type: 'Income' } })).status, 400);
  });
});

test('requests without a verified user are refused', async () => {
  await serve('/api/cases', createCasesRouter({ cases: repo() }), async base => {
    const res = await fetch(base + '/user/' + A); assert.equal(res.status, 401);
  });
});

test('csv list and reports use the session owner, not the URL or query', async () => {
  const rows = repo(); rows.rows.push({ _id: nextId(), userId: A, caseNumber: '1' });
  await serve('/api/csv-manager', createCsvRouter(rows), async base => {
    assert.equal((await as(B, base)('/list/' + A)).body.length, 0);
    assert.equal((await as(A, base)('/list/' + B)).body.length, 1);
  });
  const { default: Case } = await import('../models/case.js');
  const { default: reports } = await import('../routes/reports.js');
  const original = Case.find; let seen;
  try {
    Case.find = q => { seen = q; return { sort: () => ({ lean: async () => [] }) }; };
    await serve('/api/reports', reports, async base => {
      const res = await fetch(base + '/?startDate=2026-01-01&endDate=2026-12-31&userId=' + A, { headers: { 'x-verified-user': B } });
      assert.equal(res.status, 200); await res.arrayBuffer();
    });
    assert.equal(seen.userId, B);
  } finally { Case.find = original; }
});

test('assign-orphan-records: dry run changes nothing; apply assigns only owner-less rows', async () => {
  const data = { users: [{ _id: A, email: 'owner@example.test' }], inquiries: [{ _id: 1 }, { _id: 2, userId: B }], teammembers: [{ _id: 3, userId: null }] };
  const orphan = r => r.userId === undefined || r.userId === null;
  const db = { collection: name => ({
    findOne: async q => data[name].find(r => r.email === q.email) || null,
    countDocuments: async () => data[name].filter(orphan).length,
    updateMany: async (q, u) => { const hit = data[name].filter(orphan); hit.forEach(r => Object.assign(r, u.$set)); return { modifiedCount: hit.length }; },
  }) };
  const dry = await assignOrphans(db, { ownerEmail: 'owner@example.test', log() {} });
  assert.deepEqual(dry, { inquiries: { orphaned: 1, assigned: 0 }, teammembers: { orphaned: 1, assigned: 0 } });
  assert.equal(data.inquiries[0].userId, undefined);
  await assert.rejects(assignOrphans(db, { ownerEmail: 'missing@example.test', apply: true, log() {} }));
  await assignOrphans(db, { ownerEmail: 'OWNER@example.test', apply: true, log() {} });
  assert.equal(data.inquiries[0].userId, A); assert.equal(data.inquiries[1].userId, B); assert.equal(data.teammembers[0].userId, A);
});
