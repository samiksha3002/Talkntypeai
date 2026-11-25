// Fails a production frontend build when the API origin is missing or unsafe.
// Without VITE_API_URL, parts of the app would fall back to a guessed origin, and
// the session token could be sent to the wrong host.
export function buildEnvProblems(vars) {
  const value = String(vars.VITE_API_URL ?? '').trim();
  if (!value) return ['VITE_API_URL is not set. Set it to the Node API origin (for example https://talkntypeai.onrender.com) in the Vercel project settings for Production.'];
  let url;
  try { url = new URL(value); } catch { return [`VITE_API_URL is not a valid URL.`]; }
  const problems = [];
  if (url.protocol !== 'https:') problems.push('VITE_API_URL must use https:// in production builds.');
  if (/^(localhost|127\.|\[::1\]|0\.0\.0\.0)/i.test(url.hostname)) problems.push('VITE_API_URL must not point to localhost in production builds.');
  if (url.username || url.password || url.search || url.hash) problems.push('VITE_API_URL must not contain credentials, a query string or a fragment.');
  if (!['/', '/api', '/api/'].includes(url.pathname)) problems.push('VITE_API_URL must be an origin (optionally ending in /api), without other paths.');
  return problems;
}

export function assertProductionBuildEnv(vars) {
  const problems = buildEnvProblems(vars);
  if (problems.length) throw new Error('Production build stopped:\n  - ' + problems.join('\n  - '));
}
