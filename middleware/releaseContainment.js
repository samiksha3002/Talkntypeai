// Temporary fail-closed maintenance, not an ownership migration.
export const suspendedPrefixes = ['/api/cases','/api/clients','/api/inquiries','/api/team','/api/reports','/api/payments','/api/csv-manager','/api/deepgram'];
export function unavailable(req,res) {
  res.set('Cache-Control','no-store');
  return res.status(503).json({success:false,error:'This feature is temporarily unavailable for security maintenance.'});
}
export function installReleaseContainment(app) { app.use(suspendedPrefixes, unavailable); }
