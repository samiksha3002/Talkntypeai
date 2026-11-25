// Temporary fail-closed maintenance, not an ownership migration.
//
// Default (main's decision): inquiries, team, payments and Deepgram are suspended.
// security/critical-fixes made these features owner-scoped (inquiries/team/payments)
// and replaced the key endpoint with short-lived tokens (Deepgram), so they can be
// re-enabled after verification with RELEASE_CONTAINMENT:
//   RELEASE_CONTAINMENT unset / "default"   -> the four prefixes below stay suspended
//   RELEASE_CONTAINMENT=none                -> nothing suspended
//   RELEASE_CONTAINMENT=inquiries,team      -> only those (names or /api/... prefixes)
// Deepgram dictation additionally needs DEEPGRAM_ENABLED in src/Editor/speechCredential.js.
export const defaultSuspendedPrefixes = ['/api/inquiries','/api/team','/api/payments','/api/deepgram'];

export function containmentPrefixes(value = process.env.RELEASE_CONTAINMENT) {
  const setting = String(value ?? '').trim().toLowerCase();
  if (!setting || setting === 'default') return [...defaultSuspendedPrefixes];
  if (setting === 'none') return [];
  return setting.split(',').map(s => s.trim()).filter(Boolean).map(s => s.startsWith('/api/') ? s : '/api/' + s.replace(/^\/+/, ''));
}
export const suspendedPrefixes = containmentPrefixes();

export function unavailable(req,res) {
  res.set('Cache-Control','no-store');
  return res.status(503).json({success:false,error:'This feature is temporarily unavailable for security maintenance.'});
}
export function installReleaseContainment(app, prefixes = suspendedPrefixes) {
  if (prefixes.length) app.use(prefixes, unavailable);
  if (prefixes.length) console.log('[containment] suspended:', prefixes.join(', '));
}
