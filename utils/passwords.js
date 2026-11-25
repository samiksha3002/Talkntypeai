import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest();
export async function hashNewPassword(password) {
  if(typeof password!=='string'||!password||Buffer.byteLength(password,'utf8')>72)throw new Error('Password must contain 1 to 72 UTF-8 bytes.');
  return bcrypt.hash(password,12);
}
export async function verifyPassword(record,password) {
  if(typeof password!=='string'||!password)return false;
  if(record?.passwordHash!==undefined && record.passwordHash!==null) {
    if(typeof record.passwordHash!=='string'||!/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(record.passwordHash)||Buffer.byteLength(password,'utf8')>72)return false;
    return bcrypt.compare(password,record.passwordHash);
  }
  // Read-only compatibility: never rewrite an existing plaintext record on login.
  return typeof record?.password==='string'&&timingSafeEqual(digest(password),digest(record.password));
}
