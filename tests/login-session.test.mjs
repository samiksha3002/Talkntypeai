import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import authRouter from '../routes/auth.js';
import User from '../models/user.js';
import DraftSession from '../models/DraftSession.js';
import { hashNewPassword } from '../utils/passwords.js';

// All persistence is stubbed; these requests only reach a local HTTP server.
async function withLogin(user, createSession, run) {
  const originalFind = User.findOne;
  const originalCreate = DraftSession.create;
  const before = structuredClone(user);
  let sessionCalls = 0;
  User.findOne = async () => user;
  DraftSession.create = async record => {
    sessionCalls++;
    assert.equal(record.ownerId, user._id);
    return createSession(record);
  };
  const app = express();
  app.use(express.json(), authRouter);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const login = password => fetch(`http://127.0.0.1:${server.address().port}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password }),
    });
    await run(login, () => sessionCalls);
    assert.deepEqual(user, before, 'login must not modify the account or subscription');
  } finally {
    User.findOne = originalFind;
    DraftSession.create = originalCreate;
    await new Promise(resolve => server.close(resolve));
  }
}

for (const role of ['user', 'admin']) {
  test(`${role} login returns 503 without account or session data when session persistence fails`, async () => {
    const user = {
      _id: '000000000000000000000001', email: 'synthetic@example.test', role,
      passwordHash: await hashNewPassword('synthetic-password'),
      subscription: { isActive: role !== 'admin', plan: 'demo' },
    };
    await withLogin(user, async () => { throw new Error('synthetic-private-database-error'); }, async (login, calls) => {
      const response = await login('synthetic-password');
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), {
        message: 'Secure sign-in is temporarily unavailable. Please try again later.',
      });
      assert.equal(calls(), 1);
    });
  });

  test(`${role} login still returns a secure session after successful persistence`, async () => {
    const user = {
      _id: '000000000000000000000001', email: 'synthetic@example.test', role,
      passwordHash: await hashNewPassword('synthetic-password'),
      subscription: { isActive: role !== 'admin', plan: 'demo' },
    };
    await withLogin(user, async record => record, async (login, calls) => {
      const response = await login('synthetic-password');
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const data = await response.json();
      assert.match(data.draftSession.token, /^[a-f0-9]{64}$/);
      assert(Number.isFinite(Date.parse(data.draftSession.expiresAt)));
      assert.equal(data.user.role, role);
      assert.deepEqual(data.user.subscription, user.subscription);
      assert.equal(data.expiryDate, null);
      assert(!('password' in data.user));
      assert(!('passwordHash' in data.user));
      assert.equal(calls(), 1);
    });
  });
}

test('incorrect passwords and inactive customers never attempt session creation', async () => {
  const user = {
    _id: '000000000000000000000001', email: 'synthetic@example.test', role: 'user',
    passwordHash: await hashNewPassword('synthetic-password'),
    subscription: { isActive: false },
  };
  await withLogin(user, async () => { throw new Error('must not be called'); }, async (login, calls) => {
    assert.equal((await login('wrong-password')).status, 400);
    assert.equal((await login('synthetic-password')).status, 403);
    assert.equal(calls(), 0);
  });
});
