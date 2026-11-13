// Temporary fail-closed maintenance, not an ownership migration.
export const suspendedPrefixes = ['/api/inquiries','/api/team','/api/payments','/api/deepgram'];
export function unavailable(req,res) {
  res.set('Cache-Control','no-store');
  return res.status(503).json({success:false,error:'This feature is temporarily unavailable for security maintenance.'});
}
export function installReleaseContainment(app) { app.use(suspendedPrefixes, unavailable); }
