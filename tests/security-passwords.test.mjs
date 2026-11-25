import './fixtures/jwt.mjs'; // sets the test-only JWT secret
import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword, isBcryptHash } from '../utils/password.js';
import { migratePasswords } from '../scripts/hash-existing-passwords.mjs';
import { upsertAdmin } from '../scripts/create-admin.mjs';
import { verifyJwt } from '../utils/jwt.js';

const U = '00000000000000000000000b';
const fastHash = async value => bcrypt.hash(value, 4);

test('hashPassword uses bcrypt cost 12 and verifyPassword checks hashes and legacy plain text', async () => {
  const hash = await hashPassword('correct horse battery');
  assert.match(hash, /^\$2[aby]\$12\$/); assert.ok(isBcryptHash(hash));
  assert.deepEqual(await verifyPassword('correct horse battery', hash), { ok: true, needsUpgrade: false });
  assert.deepEqual(await verifyPassword('wrong', hash), { ok: false, needsUpgrade: false });
  assert.deepEqual(await verifyPassword('legacy-pass', 'legacy-pass'), { ok: true, needsUpgrade: true });
  assert.deepEqual(await verifyPassword('legacy-pass', 'other'), { ok: false, needsUpgrade: false });
  for (const stored of [undefined, null, '', 42]) assert.equal((await verifyPassword('x', stored)).ok, false);
});

test('user schema hides the password field by default', async () => {
  const { default: User } = await import('../models/user.js');
  assert.equal(User.schema.path('password').options.select, false);
});

function routeHandler(router, path) { return router.stack.find(l => l.route?.path === path).route.stack.at(-1).handle; }
const invoker = handler => async body => { const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, setHeader() {}, json(b) { this.body = b; return this; } }; await handler({ body }, res); return res; };

test('login: legacy plain-text account still signs in and is upgraded to bcrypt (compare-and-set)', async () => {
  const { default: User } = await import('../models/user.js');
  const { default: Session } = await import('../models/DraftSession.js');
  const { default: router } = await import('../routes/auth.js');
  const original = { findOne: User.findOne, updateOne: User.updateOne, create: Session.create };
  const stored = { _id: U, email: 'user@example.test', password: 'legacy-plain-1', role: 'user', subscription: { isActive: true } };
  const updates = [];
  try {
    User.findOne = () => ({ select: async projection => { assert.equal(projection, '+password'); return { ...stored }; } });
    User.updateOne = async (filter, update) => { updates.push([filter, update]); return { modifiedCount: 1 }; };
    Session.create = async () => ({});
    const login = invoker(routeHandler(router, '/login'));
    const ok = await login({ email: 'user@example.test', password: 'legacy-plain-1' });
    assert.equal(ok.statusCode, 200); assert.equal(verifyJwt(ok.body.token).sub, U);
    assert.ok(!JSON.stringify(ok.body).includes('legacy-plain-1'));
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0][0], { _id: U, password: 'legacy-plain-1' });
    assert.ok(await bcrypt.compare('legacy-plain-1', updates[0][1].$set.password));
    assert.match(updates[0][1].$set.password, /^\$2[aby]\$12\$/);
    assert.equal((await login({ email: 'user@example.test', password: 'wrong' })).statusCode, 401);

    const hashed = await fastHash('hashed-pass-1');
    User.findOne = () => ({ select: async () => ({ ...stored, password: hashed }) });
    updates.length = 0;
    const second = await login({ email: 'user@example.test', password: 'hashed-pass-1' });
    assert.equal(second.statusCode, 200); assert.equal(updates.length, 0);
    assert.ok(!JSON.stringify(second.body).includes(hashed));
  } finally { Object.assign(User, { findOne: original.findOne, updateOne: original.updateOne }); Session.create = original.create; }
});

test('register: stores a bcrypt hash, never the plain password, and enforces minimum length', async () => {
  const { default: User } = await import('../models/user.js');
  const { default: router } = await import('../routes/auth.js');
  const original = { findOne: User.findOne, save: User.prototype.save };
  let saved;
  try {
    User.findOne = async () => null;
    User.prototype.save = async function () { saved = this.toObject(); return this; };
    const register = invoker(routeHandler(router, '/create-user'));
    assert.equal((await register({ fullName: 'A', email: 'a@example.test', password: 'short' })).statusCode, 400);
    assert.equal((await register({ fullName: 'A', email: { $ne: null }, password: 'long-enough-1' })).statusCode, 400);
    const res = await register({ fullName: 'A', email: 'A@Example.test', password: 'long-enough-1' });
    assert.equal(res.statusCode, 201);
    assert.equal(saved.email, 'a@example.test'); assert.equal(saved.role, 'user');
    assert.notEqual(saved.password, 'long-enough-1'); assert.ok(await bcrypt.compare('long-enough-1', saved.password));
  } finally { User.findOne = original.findOne; User.prototype.save = original.save; }
});

function fakeUsers(docs) {
  const isHash = v => typeof v === 'string' && /^\$2[aby]\$\d{2}\$/.test(v);
  const matches = (doc, q) => {
    if (q.password?.$not) return typeof doc.password === 'string' && !isHash(doc.password);
    if (q.password?.$regex) return isHash(doc.password);
    if (q.email) return doc.email === q.email;
    return true;
  };
  const writes = [];
  return { docs, writes,
    async countDocuments(q) { return docs.filter(d => matches(d, q)).length; },
    find(q) { const rows = docs.filter(d => matches(d, q)).map(d => ({ ...d })); return { async *[Symbol.asyncIterator]() { yield* rows; } }; },
    async findOne(q) { return docs.find(d => matches(d, q)) || null; },
    async updateOne(filter, update) {
      writes.push(['update', filter]);
      const doc = docs.find(d => d._id === filter._id && (filter.password === undefined || d.password === filter.password));
      if (!doc) return { modifiedCount: 0 };
      for (const [k, v] of Object.entries(update.$set)) if (!k.includes('.')) doc[k] = v; else doc[k.split('.')[0]] = { ...doc[k.split('.')[0]], [k.split('.')[1]]: v };
      return { modifiedCount: 1 };
    },
    async insertOne(doc) { writes.push(['insert', doc.email]); docs.push({ _id: 'new', ...doc }); },
  };
}

test('migration --dry-run writes nothing; --apply hashes only plain text and never logs passwords', async () => {
  const existingHash = await fastHash('already');
  const users = fakeUsers([{ _id: 1, password: 'plain-one' }, { _id: 2, password: existingHash }, { _id: 3, password: 'plain-two' }]);
  const lines = []; const log = line => lines.push(line);
  const dry = await migratePasswords(users, { apply: false, log, hash: fastHash });
  assert.equal(dry.toMigrate, 2); assert.equal(dry.alreadyHashed, 1); assert.deepEqual(users.writes, []);
  assert.equal(users.docs[0].password, 'plain-one');
  const applied = await migratePasswords(users, { apply: true, log, hash: fastHash });
  assert.equal(applied.migrated, 2);
  assert.ok(await bcrypt.compare('plain-one', users.docs[0].password));
  assert.ok(await bcrypt.compare('plain-two', users.docs[2].password));
  assert.equal(users.docs[1].password, existingHash);
  assert.ok(!lines.join('\n').includes('plain-'));
  const again = await migratePasswords(users, { apply: true, log, hash: fastHash });
  assert.equal(again.toMigrate, 0); assert.equal(again.migrated, 0);
});

test('migration never overwrites a password that changed between read and write', async () => {
  const users = fakeUsers([{ _id: 1, password: 'plain-one' }]);
  const hash = async value => { users.docs[0].password = await fastHash('user-changed-it'); return fastHash(value); };
  const result = await migratePasswords(users, { apply: true, log() {}, hash });
  assert.equal(result.migrated, 0); assert.equal(result.skippedChanged, 1);
  assert.ok(await bcrypt.compare('user-changed-it', users.docs[0].password));
});

function fakeSessions(rows) {
  const deleted = [];
  return { rows, deleted, async deleteMany(q) {
    const before = rows.length;
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].ownerId === q.ownerId) { deleted.push(rows[i]); rows.splice(i, 1); }
    return { deletedCount: before - rows.length };
  } };
}

test('create-admin: dry run needs no password and writes nothing; apply creates or promotes with a bcrypt hash', async () => {
  const users = fakeUsers([{ _id: 7, email: 'existing@example.test', role: 'user', password: 'x' }]);
  const sessions = fakeSessions([{ ownerId: 7 }, { ownerId: 7 }, { ownerId: 99 }]);
  await assert.rejects(upsertAdmin(users, { email: 'bad', log() {} }));
  assert.equal(await upsertAdmin(users, { email: 'boss@example.test', log() {} }), 'create', 'dry run works without a password');
  assert.equal(await upsertAdmin(users, { email: 'existing@example.test', log() {}, sessions }), 'promote');
  assert.deepEqual(users.writes, []); assert.equal(sessions.rows.length, 3, 'dry run revokes nothing');
  await assert.rejects(upsertAdmin(users, { email: 'boss@example.test', password: 'short', apply: true, sessions, log() {} }), /at least 12/);
  await assert.rejects(upsertAdmin(users, { email: 'boss@example.test', apply: true, sessions, log() {} }), /at least 12/);
  assert.equal(await upsertAdmin(users, { email: 'Boss@Example.test', password: 'long-enough-password', apply: true, sessions, log() {}, hash: fastHash }), 'create');
  const created = users.docs.find(d => d.email === 'boss@example.test');
  assert.equal(created.role, 'admin'); assert.ok(await bcrypt.compare('long-enough-password', created.password));
  assert.equal(sessions.rows.length, 3, 'creating a new account revokes nothing');
});

test('create-admin: promote and password reset revoke all existing sessions of that account only', async () => {
  const users = fakeUsers([{ _id: 7, email: 'existing@example.test', role: 'user', password: 'x' }, { _id: 8, email: 'boss@example.test', role: 'admin', password: 'y' }]);
  const sessions = fakeSessions([{ ownerId: 7 }, { ownerId: 7 }, { ownerId: 8 }, { ownerId: 99 }]);
  const lines = [];
  assert.equal(await upsertAdmin(users, { email: 'existing@example.test', password: 'another-long-password', apply: true, sessions, log: l => lines.push(l), hash: fastHash }), 'promote');
  assert.equal(users.docs[0].role, 'admin'); assert.ok(await bcrypt.compare('another-long-password', users.docs[0].password));
  assert.deepEqual(sessions.rows.map(r => r.ownerId), [8, 99]);
  assert.ok(lines.some(l => /Revoked 2 existing session/.test(l)));
  assert.equal(await upsertAdmin(users, { email: 'boss@example.test', password: 'reset-long-password', apply: true, sessions, log() {}, hash: fastHash }), 'reset-password');
  assert.deepEqual(sessions.rows.map(r => r.ownerId), [99]);
  assert.ok(!lines.join('\n').includes('another-long-password'), 'password is never logged');
});

test('create-admin: password is read hidden from a terminal, or from piped stdin, never echoed', async () => {
  const { readPassword, promptNewPassword } = await import('../scripts/create-admin.mjs');
  const { PassThrough, Readable } = await import('node:stream');
  const piped = Readable.from(['piped-secret-value\nignored second line\n']);
  assert.equal(await readPassword('x', { input: piped, output: new PassThrough() }), 'piped-secret-value');

  const terminal = () => { const s = new PassThrough(); s.isTTY = true; s.raw = []; s.setRawMode = v => s.raw.push(v); return s; };
  let shown = ''; const output = { write: t => { shown += t; } };
  const input = terminal();
  const pending = promptNewPassword({ input, output });
  input.write('zeb'); input.write('ra-x'); input.write('\u007f'); input.write('pass\r');   // backspace removes "x"
  await new Promise(r => setImmediate(r));
  input.write('zebra-pass\r');
  assert.equal(await pending, 'zebra-pass');
  assert.ok(!shown.includes('zebra'), 'typed characters are not echoed');
  assert.deepEqual(input.raw, [true, false, true, false], 'raw mode is restored after each prompt');

  const mismatch = terminal();
  const failing = promptNewPassword({ input: mismatch, output });
  mismatch.write('first-password\r'); await new Promise(r => setImmediate(r)); mismatch.write('other-password\r');
  await assert.rejects(failing, /do not match/);
});
