#!/usr/bin/env node
// Create (or promote) the administrator account in the database.
// There is no hard-coded admin login; admins are ordinary DB users with role "admin".
//
//   ADMIN_EMAIL=… node scripts/create-admin.mjs --dry-run    # shows what would happen; no password asked
//   ADMIN_EMAIL=… node scripts/create-admin.mjs --apply      # asks for the password (hidden), twice
//
// Non-interactive: pipe the password on stdin (first line is used), e.g. from a
// password manager:  <your-password-manager-cli> | ADMIN_EMAIL=… node scripts/create-admin.mjs --apply
// The password is never taken from an environment variable or the command line
// (those end up in shell history / process listings), never printed, and is
// stored only as a bcrypt hash. Optional ADMIN_NAME.
//
// Promoting an existing account or resetting an admin's password revokes ALL of
// that account's existing sessions, so tokens issued before the change stop working.
//
// Windows Git Bash (mintty) is not a real terminal for Node: typing there would be
// visible. Use PowerShell / cmd, or run `winpty node scripts/create-admin.mjs --apply`.
import { pathToFileURL } from 'node:url';
import { hashPassword, passwordProblem } from '../utils/password.js';

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export async function upsertAdmin(users, { email, password, name = 'Administrator', apply = false, sessions, log = console.log, hash = hashPassword }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('ADMIN_EMAIL must be a valid email address.');
  if (apply) {
    if (typeof password !== 'string' || password.length < MIN_ADMIN_PASSWORD_LENGTH) throw new Error(`The admin password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`);
    const problem = passwordProblem(password); if (problem) throw new Error(problem);
    if (!sessions) throw new Error('A sessions collection is required to revoke existing sessions.');
  }
  const existing = await users.findOne({ email: normalized }, { projection: { _id: 1, role: 1 } });
  const action = existing ? (existing.role === 'admin' ? 'reset-password' : 'promote') : 'create';
  log(`${apply ? 'Applying' : 'Dry run'}: ${action} administrator ${normalized}` +
    (existing ? ' (all existing sessions of this account will be revoked)' : ''));
  if (!apply) return action;
  const passwordHash = await hash(password);
  if (existing) {
    await users.updateOne({ _id: existing._id }, { $set: { role: 'admin', password: passwordHash, 'subscription.isActive': true } });
    const { deletedCount = 0 } = await sessions.deleteMany({ ownerId: existing._id });
    log(`Revoked ${deletedCount} existing session(s) for this account.`);
  } else {
    const now = new Date();
    await users.insertOne({ fullName: name, email: normalized, password: passwordHash, role: 'admin',
      subscription: { plan: 'admin', isActive: true, startDate: now, expiryDate: null }, createdAt: now, updatedAt: now });
  }
  log('Done.');
  return action;
}

// Reads one password without echoing it (terminal) or the first line of piped stdin.
export function readPassword(prompt, { input = process.stdin, output = process.stderr } = {}) {
  if (!input.isTTY) {
    return new Promise((resolve, reject) => {
      let data = '';
      input.setEncoding?.('utf8');
      input.on('data', chunk => { data += chunk; });
      input.on('end', () => resolve(data.split(/\r?\n/)[0]));
      input.on('error', reject);
    });
  }
  return new Promise((resolve, reject) => {
    let value = '';
    output.write(prompt);
    input.setRawMode(true);
    input.setEncoding?.('utf8');
    input.resume();
    const finish = (error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      output.write('\n');
      if (error) reject(error); else resolve(value);
    };
    const onData = chunk => {
      for (const ch of String(chunk)) {
        if (ch === '\r' || ch === '\n') return finish();
        if (ch === '\u0003') return finish(new Error('Cancelled.'));          // Ctrl+C
        if (ch === '\u007f' || ch === '\b') { value = value.slice(0, -1); continue; }  // Backspace
        if (ch >= ' ') value += ch;                                          // ignore other control keys
      }
    };
    input.on('data', onData);
  });
}

export async function promptNewPassword(options) {
  const first = await readPassword('New admin password (hidden): ', options);
  if (!(options?.input ?? process.stdin).isTTY) return first;
  const second = await readPassword('Repeat the password: ', options);
  if (first !== second) throw new Error('The passwords do not match.');
  return first;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply'), dryRun = args.has('--dry-run');
  if (apply === dryRun) { console.error('Usage: ADMIN_EMAIL=… node scripts/create-admin.mjs --dry-run | --apply'); process.exit(1); }
  if (process.env.ADMIN_PASSWORD !== undefined) {
    console.error('ADMIN_PASSWORD is no longer read (environment variables leak into shell history and process listings). Unset it; the password is asked for at the prompt or read from stdin.');
    process.exit(1);
  }
  if (apply && !process.stdin.isTTY && process.env.TERM_PROGRAM === 'mintty') {
    console.error('Warning: Git Bash (mintty) is not a real terminal for Node. If you are TYPING the password it will be visible; press Ctrl+C and use PowerShell, cmd or `winpty node scripts/create-admin.mjs --apply` instead. (Piped input is fine.)');
  }
  await import('dotenv/config');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error('Set MONGODB_URI (or MONGO_URI) first.'); process.exit(1); }
  const password = apply ? await promptNewPassword() : undefined;
  const { default: mongoose } = await import('mongoose');
  const { default: DraftSession } = await import('../models/DraftSession.js');
  await mongoose.connect(uri);
  try {
    await upsertAdmin(mongoose.connection.collection('users'), {
      email: process.env.ADMIN_EMAIL, password, name: process.env.ADMIN_NAME, apply,
      sessions: mongoose.connection.collection(DraftSession.collection.collectionName),
    });
  } finally { await mongoose.disconnect(); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => { console.error('create-admin failed:', error?.message); process.exit(1); });
}
