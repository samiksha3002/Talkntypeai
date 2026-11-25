#!/usr/bin/env node
// Inquiries and team members were stored without an owner before ownership
// checks existed. After the fix they are visible to nobody. This script assigns
// all owner-less records in those collections to ONE account you choose.
//
//   OWNER_EMAIL=advocate@example.com node scripts/assign-orphan-records.mjs --dry-run
//   OWNER_EMAIL=advocate@example.com node scripts/assign-orphan-records.mjs --apply
//
// Only run --apply if you know all existing records belong to that one account;
// otherwise leave them unassigned (or delete them) after reviewing the dry run.
import { pathToFileURL } from 'node:url';

export const ORPHAN_COLLECTIONS = ['inquiries', 'teammembers'];
const ORPHAN = { $or: [{ userId: { $exists: false } }, { userId: null }] };

export async function assignOrphans(db, { ownerEmail, apply = false, log = console.log }) {
  const email = String(ownerEmail || '').trim().toLowerCase();
  if (!email) throw new Error('Set OWNER_EMAIL to the account that should own the records.');
  const owner = await db.collection('users').findOne({ email }, { projection: { _id: 1 } });
  if (!owner) throw new Error('No user with that email.');
  const summary = {};
  for (const name of ORPHAN_COLLECTIONS) {
    const count = await db.collection(name).countDocuments(ORPHAN);
    summary[name] = { orphaned: count, assigned: 0 };
    log(`${name}: ${count} record(s) without an owner`);
    if (apply && count) summary[name].assigned = (await db.collection(name).updateMany(ORPHAN, { $set: { userId: owner._id } })).modifiedCount;
  }
  log(apply ? 'Assigned.' : 'Dry run: nothing changed. Re-run with --apply to assign.');
  return summary;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply'), dryRun = args.has('--dry-run');
  if (apply === dryRun) { console.error('Usage: OWNER_EMAIL=… node scripts/assign-orphan-records.mjs --dry-run | --apply'); process.exit(1); }
  await import('dotenv/config');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error('Set MONGODB_URI (or MONGO_URI) first.'); process.exit(1); }
  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(uri);
  try { await assignOrphans(mongoose.connection.db, { ownerEmail: process.env.OWNER_EMAIL, apply }); }
  finally { await mongoose.disconnect(); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => { console.error('assign-orphan-records failed:', error?.message); process.exit(1); });
}
