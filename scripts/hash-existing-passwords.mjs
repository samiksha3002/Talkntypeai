#!/usr/bin/env node
// One-time migration: replace plain-text passwords in the users collection with
// bcrypt hashes (cost 12).
//
//   node scripts/hash-existing-passwords.mjs --dry-run   # count only, writes nothing
//   node scripts/hash-existing-passwords.mjs --apply     # hash and update
//
// Reads MONGODB_URI (or MONGO_URI) from the environment / .env.
// Never prints passwords or connection credentials. Safe to re-run: already
// hashed passwords are skipped, and each update is compare-and-set so a
// password that changed in the meantime is never overwritten.
import { pathToFileURL } from 'node:url';
import { hashPassword, isBcryptHash } from '../utils/password.js';

const LEGACY = { password: { $exists: true, $type: 'string', $not: /^\$2[aby]\$\d{2}\$/ } };

export async function migratePasswords(users, { apply = false, log = console.log, hash = hashPassword } = {}) {
  const total = await users.countDocuments({});
  const legacy = await users.countDocuments(LEGACY);
  const summary = { total, alreadyHashed: 0, toMigrate: legacy, migrated: 0, skippedChanged: 0, skippedInvalid: 0 };
  summary.alreadyHashed = await users.countDocuments({ password: { $type: 'string', $regex: /^\$2[aby]\$\d{2}\$/ } });
  log(`Users: ${total} · already hashed: ${summary.alreadyHashed} · plain text to migrate: ${legacy}`);
  if (!apply) { log('Dry run: no changes written. Re-run with --apply to migrate.'); return summary; }
  const cursor = users.find(LEGACY, { projection: { _id: 1, password: 1 } });
  for await (const doc of cursor) {
    if (typeof doc.password !== 'string' || !doc.password || isBcryptHash(doc.password)) { summary.skippedInvalid++; continue; }
    const result = await users.updateOne({ _id: doc._id, password: doc.password }, { $set: { password: await hash(doc.password) } });
    if (result.modifiedCount === 1) summary.migrated++; else summary.skippedChanged++;
    if ((summary.migrated + summary.skippedChanged) % 50 === 0) log(`… ${summary.migrated} migrated`);
  }
  log(`Done: migrated ${summary.migrated}, skipped (changed meanwhile) ${summary.skippedChanged}, skipped (empty/invalid) ${summary.skippedInvalid}.`);
  return summary;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply'), dryRun = args.has('--dry-run');
  if (apply === dryRun) { console.error('Usage: node scripts/hash-existing-passwords.mjs --dry-run | --apply'); process.exit(1); }
  await import('dotenv/config');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error('Set MONGODB_URI (or MONGO_URI) first.'); process.exit(1); }
  const { default: mongoose } = await import('mongoose');
  let host = 'unknown host';
  try { host = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).hostname; } catch { /* keep placeholder */ }
  console.log(`${apply ? 'APPLYING' : 'DRY RUN'} against database host: ${host}`);
  await mongoose.connect(uri);
  try { await migratePasswords(mongoose.connection.collection('users'), { apply }); }
  finally { await mongoose.disconnect(); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => { console.error('Migration failed:', error?.message); process.exit(1); });
}
