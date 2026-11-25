import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

// Regression guard: no credentials in tracked text files. Reports file names only,
// never the matched value.
const PATTERNS = {
  'Google API key': /AIza[0-9A-Za-z_-]{30,}/,
  'OpenAI key': /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  'MongoDB URI with password': /mongodb(?:\+srv)?:\/\/[^\s:/@"'`]+:[^\s@"'`]+@/,
  'Razorpay key': /rzp_(?:live|test)_[A-Za-z0-9]{8,}/,
  'eCourtsIndia token': /eci_live_[A-Za-z0-9]{10,}/,
  'Quoted 40-hex token (IK/Deepgram style)': /["'`][0-9a-f]{40}["'`]/,
  '40-hex token in a comment': /\/\/.*\b[0-9a-f]{40}\b/,
  'Private key block': /-----BEGIN (?:RSA |EC |)PRIVATE KEY-----/,
};
const SKIP = /(^|\/)(package-lock\.json|node_modules\/)|\.(png|jpe?g|gif|webp|ico|pdf|mp4|ttf|woff2?|bin|pickle|sqlite3|pyc|zip|traineddata)$/i;

test('tracked files contain no hard-coded credentials', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(f => f && !SKIP.test(f) && fs.existsSync(f));
  assert.ok(files.length > 100);
  const findings = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [name, pattern] of Object.entries(PATTERNS)) if (pattern.test(text)) findings.push(`${file}: ${name}`);
  }
  assert.deepEqual(findings, []);
});

test('helper scripts read the Indian Kanoon token from the environment only and never print it', () => {
  for (const file of ['test-ik.mjs', 'verify-token.mjs']) {
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /process\.env\.INDIAN_KANOON_API_TOKEN/);
    assert.doesNotMatch(text, /process\.argv\[2\]/, file + ' must not take the token as an argument');
    assert.doesNotMatch(text, /(TOKEN|token)\.slice\(/, file + ' must not print part of the token');
    assert.doesNotMatch(text, /INDIAN_KANOON_API_TOKEN=\$\{/, file + ' must not print the token');
    assert.match(text, /--confirm-paid/);
  }
});
