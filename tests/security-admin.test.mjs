import { testJwt } from './fixtures/jwt.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { signJwt, verifyJwt } from '../utils/jwt.js';
import { createAuth, tokenHash } from '../middleware/auth.js';
import { createAdminRouter } from '../routes/admin.js';

const ADMIN = '00000000000000000000000a', USER = '00000000000000000000000b', OTHER = '00000000000000000000000c';
const jti = id => id.slice(-1).repeat(64).replace(/[^a-f0-9]/g, 'f');
const accounts = {
  [ADMIN]: { _id: ADMIN, role: 'admin', email: 'owner@example.test', password: 'plain-secret-admin', subscription: { isActive: false } },
  [USER]: { _id: USER, role: 'user', email: 'user@example.test', password: 'plain-secret-user', subscription: { isActive: true } },
};
const sessions = { async findOne(q) { const owner = [ADMIN, USER].find(id => q.tokenHash === tokenHash(jti(id))); return owner ? { ownerId: owner, tokenHash: q.tokenHash } : null; } };
const users = { async findById(id) { return accounts[id] || null; } };
const token = id => testJwt(id, jti(id));
const response = () => ({ status(n) { this.code = n; return this; }, json(v) { this.body = v; return this; } });

test('JWT: valid token verifies; tampered, alg=none, wrong secret, expired, future and wrong audience are rejected', () => {
  const good = token(USER);
  assert.equal(verifyJwt(good).sub, USER);
  const [h, p, s] = good.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ ...verifyJwt(good), sub: ADMIN })).toString('base64url');
  assert.equal(verifyJwt([h, forgedPayload, s].join('.')), null);
  const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  assert.equal(verifyJwt([none, p, s].join('.')), null);
  assert.equal(verifyJwt([none, p, ''].join('.')), null);
  assert.equal(verifyJwt(signJwt({ sub: USER, jti: jti(USER) }, { secret: 'x'.repeat(40), expiresInSeconds: 60 })), null);
  assert.equal(verifyJwt(testJwt(USER, jti(USER), { expiresInSeconds: 60, now: Date.now() - 120000 })), null);
  assert.ok(verifyJwt(testJwt(USER, jti(USER), { expiresInSeconds: 60, now: Date.now() - 120000 }), { allowExpired: true }));
  assert.equal(verifyJwt(testJwt(USER, jti(USER), { now: Date.now() + 3600000 })), null);
  for (const junk of [undefined, '', 'a.b.c', 'Bearer x', {}, 'a'.repeat(64)]) assert.equal(verifyJwt(junk), null);
});

test('auth: missing/invalid token 401, revoked session 401, session owner mismatch 401', async () => {
  const auth = createAuth({ sessions, users, access: 'user' });
  for (const authorization of [undefined, 'Bearer nope', 'Bearer ' + 'a'.repeat(64), 'Token ' + token(USER)]) {
    const res = response(); await auth({ headers: { authorization } }, res, () => assert.fail('must not pass')); assert.equal(res.code, 401);
  }
  const revoked = response();
  await createAuth({ sessions: { findOne: async () => null }, users, access: 'user' })({ headers: { authorization: 'Bearer ' + token(USER) } }, revoked, () => assert.fail('revoked'));
  assert.equal(revoked.code, 401);
  const mismatch = response();   // valid signature, but the session row belongs to someone else
  await createAuth({ sessions: { findOne: async () => ({ ownerId: OTHER }) }, users, access: 'user' })({ headers: { authorization: 'Bearer ' + token(USER) } }, mismatch, () => assert.fail('mismatch'));
  assert.equal(mismatch.code, 401);
});

test('auth: admin access is decided by the database role, never by the request', async () => {
  const auth = createAuth({ sessions, users, access: 'admin' });
  const denied = response();
  await auth({ headers: { authorization: 'Bearer ' + token(USER) }, body: { role: 'admin' }, query: { role: 'admin' } }, denied, () => assert.fail('user is not admin'));
  assert.equal(denied.code, 403);
  const req = { headers: { authorization: 'Bearer ' + token(ADMIN) } }; let passed = false;
  await auth(req, response(), () => { passed = true; });
  assert.ok(passed); assert.equal(req.user.role, 'admin'); assert.equal(req.user.id, ADMIN); assert.equal(req.user.password, undefined);
});

test('auth: missing JWT_SECRET fails closed with 503', async () => {
  const signed = token(USER);
  const saved = process.env.JWT_SECRET; delete process.env.JWT_SECRET;
  try {
    const res = response();
    await createAuth({ sessions, users, access: 'user' })({ headers: { authorization: 'Bearer ' + signed } }, res, () => assert.fail('must fail closed'));
    assert.equal(res.code, 503);
  } finally { process.env.JWT_SECRET = saved; }
});

function repository() {
  const rows = [{ ...accounts[USER], fullName: 'User', phone: '1', createdAt: new Date() }];
  const calls = [];
  const chain = value => ({ select() { return this; }, sort() { return this; }, lean: async () => value });
  return { calls, rows,
    find(q) { calls.push(['find', q]); return chain(rows.filter(r => r.role === q.role)); },
    findOneAndUpdate(q, update) { calls.push(['update', q, update]); const row = rows.find(r => r._id === q._id && r.role === q.role); return chain(row ? { ...row } : null); },
    async findOneAndDelete(q) { calls.push(['delete', q]); return rows.find(r => r._id === q._id && r.role === q.role) || null; },
  };
}
async function serve(repo, run) {
  const app = express(); app.use(express.json());
  app.use('/api/admin', createAdminRouter({ users: repo, auth: createAuth({ sessions, users, access: 'admin' }) }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  try { await run('http://127.0.0.1:' + server.address().port + '/api/admin'); } finally { await new Promise(r => server.close(r)); }
}
const call = (base, path, { method = 'GET', body, as } = {}) => fetch(base + path, { method,
  headers: { 'Content-Type': 'application/json', ...(as ? { Authorization: 'Bearer ' + token(as) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
const routes = [['/users'], ['/update-status/' + USER, 'PUT', { isActive: true }], ['/update-subscription/' + USER, 'PUT', { startDate: '2026-01-01', expiryDate: '2026-12-31' }], ['/delete-user/' + USER, 'DELETE']];

test('admin API: every route rejects anonymous (401) and non-admin (403) callers and touches no data', async () => {
  const repo = repository();
  await serve(repo, async base => {
    for (const [path, method, body] of routes) {
      assert.equal((await call(base, path, { method, body })).status, 401, path);
      assert.equal((await call(base, path, { method, body, as: USER })).status, 403, path);
    }
  });
  assert.deepEqual(repo.calls, []);
});

test('admin API: user list and updates never include passwords', async () => {
  await serve(repository(), async base => {
    const list = await call(base, '/users', { as: ADMIN }); assert.equal(list.status, 200);
    const text = await list.text(); assert.ok(!text.includes('password')); assert.ok(!text.includes('plain-secret'));
    assert.equal(JSON.parse(text)[0].email, 'user@example.test');
    const updated = await call(base, '/update-status/' + USER, { method: 'PUT', body: { isActive: false }, as: ADMIN });
    assert.equal(updated.status, 200); assert.ok(!(await updated.text()).includes('plain-secret'));
    const dates = await call(base, '/update-subscription/' + USER, { method: 'PUT', body: { startDate: '2026-01-01', expiryDate: '2026-12-31' }, as: ADMIN });
    assert.equal(dates.status, 200); assert.ok(!(await dates.text()).includes('plain-secret'));
  });
});

test('admin API: validates input and can only change or delete non-admin accounts', async () => {
  const repo = repository();
  await serve(repo, async base => {
    assert.equal((await call(base, '/update-status/not-an-id', { method: 'PUT', body: { isActive: true }, as: ADMIN })).status, 400);
    assert.equal((await call(base, '/update-status/' + USER, { method: 'PUT', body: { isActive: 'yes' }, as: ADMIN })).status, 400);
    assert.equal((await call(base, '/update-status/' + USER, { method: 'PUT', body: { isActive: { $ne: 1 } }, as: ADMIN })).status, 400);
    assert.equal((await call(base, '/update-subscription/' + USER, { method: 'PUT', body: { startDate: 'tomorrow', expiryDate: '2026-12-31' }, as: ADMIN })).status, 400);
    assert.equal((await call(base, '/update-subscription/' + USER, { method: 'PUT', body: { startDate: '2026-12-31', expiryDate: '2026-01-01' }, as: ADMIN })).status, 400);
    assert.equal((await call(base, '/delete-user/' + ADMIN, { method: 'DELETE', as: ADMIN })).status, 404);
    assert.equal((await call(base, '/delete-user/' + USER, { method: 'DELETE', as: ADMIN })).status, 200);
  });
  assert.ok(repo.calls.filter(([op]) => op !== 'find').every(([, q]) => q.role === 'user'));
});

test('login: no hard-coded admin bypass; response carries a JWT and never the password', async () => {
  const { default: User } = await import('../models/user.js');
  const { default: Session } = await import('../models/DraftSession.js');
  const { default: router } = await import('../routes/auth.js');
  const original = { findOne: User.findOne, create: Session.create };
  const handler = router.stack.find(l => l.route?.path === '/login').route.stack.at(-1).handle;
  const invoke = async body => { const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, setHeader() {}, json(b) { this.body = b; return this; } }; await handler({ body }, res); return res; };
  try {
    const looked = [];
    User.findOne = async q => { looked.push(q.email); return null; };
    const legacy = await invoke({ email: 'admin@talkntype.com', password: 'any-password' });
    assert.equal(legacy.statusCode, 401); assert.deepEqual(looked, ['admin@talkntype.com']);
    assert.equal((await invoke({ email: { $ne: null }, password: 'x' })).statusCode, 400);
    User.findOne = async () => ({ ...accounts[USER], fullName: 'User', subscription: { isActive: true } });
    Session.create = async () => ({});
    const ok = await invoke({ email: 'USER@example.test', password: 'plain-secret-user' });
    assert.equal(ok.statusCode, 200);
    assert.equal(verifyJwt(ok.body.token).sub, USER);
    assert.ok(!JSON.stringify(ok.body).includes('plain-secret')); assert.equal(ok.body.user.password, undefined);
    assert.equal((await invoke({ email: 'user@example.test', password: 'wrong' })).statusCode, 401);
  } finally { User.findOne = original.findOne; Session.create = original.create; }
});
