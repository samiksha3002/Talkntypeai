#!/usr/bin/env node
// Create (or promote) the administrator account in the database.
// There is no hard-coded admin login; admins are ordinary DB users with role "admin".
//
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/create-admin.mjs --dry-run
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/create-admin.mjs --apply
//
// Optional ADMIN_NAME. The password is stored as a bcrypt hash and never printed.
import { pathToFileURL } from 'node:url';
import { hashPassword, passwordProblem } from '../utils/password.js';

export async function upsertAdmin(users, { email, password, name = 'Administrator', apply = false, log = console.log, hash = hashPassword }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('ADMIN_EMAIL must be a valid email address.');
  if (typeof password !== 'string' || password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  const problem = passwordProblem(password); if (problem) throw new Error(problem);
  const existing = await users.findOne({ email: normalized }, { projection: { _id: 1, role: 1 } });
  const action = existing ? (existing.role === 'admin' ? 'reset-password' : 'promote') : 'create';
  log(`${apply ? 'Applying' : 'Dry run'}: ${action} administrator ${normalized}`);
  if (!apply) return action;
  const passwordHash = await hash(password);
  if (existing) await users.updateOne({ _id: existing._id }, { $set: { role: 'admin', password: passwordHash, 'subscription.isActive': true } });
  else {
    const now = new Date();
    await users.insertOne({ fullName: name, email: normalized, password: passwordHash, role: 'admin',
      subscription: { plan: 'admin', isActive: true, startDate: now, expiryDate: null }, createdAt: now, updatedAt: now });
  }
  log('Done.');
  return action;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply'), dryRun = args.has('--dry-run');
  if (apply === dryRun) { console.error('Usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/create-admin.mjs --dry-run | --apply'); process.exit(1); }
  await import('dotenv/config');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error('Set MONGODB_URI (or MONGO_URI) first.'); process.exit(1); }
  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(uri);
  try {
    await upsertAdmin(mongoose.connection.collection('users'), { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: process.env.ADMIN_NAME, apply });
  } finally { await mongoose.disconnect(); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => { console.error('create-admin failed:', error?.message); process.exit(1); });
}
