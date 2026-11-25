// Helpers for per-user records. The owner always comes from the verified session
// (req.user / req.draftOwnerId, set by middleware/auth.js), never from the request
// body, query or URL. A claimed userId that differs is rejected by
// middleware/tenantScope.js (matchingOwner).
export const validObjectId = value => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

export function ownerOf(req) {
  const id = req.user?.id ?? (req.draftOwnerId !== undefined && req.draftOwnerId !== null ? String(req.draftOwnerId) : undefined);
  if (typeof id !== 'string' || !id) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  return id;
}

// Copies only whitelisted string/number/date-like fields; ignores everything else
// (including userId, _id, ownerId, role and any operator objects).
export function pick(body, fields, { max = 5000 } = {}) {
  const out = {};
  for (const key of fields) {
    if (!Object.hasOwn(body || {}, key)) continue;
    const value = body[key];
    if (value === null || value === '') { out[key] = value; continue; }
    if (typeof value === 'number' && Number.isFinite(value)) { out[key] = value; continue; }
    if (typeof value === 'string' && value.length <= max) { out[key] = value; continue; }
    throw Object.assign(new Error(`Invalid value for ${key}.`), { status: 400 });
  }
  return out;
}

// Works with Mongoose models (Model.create) and constructor/save repositories.
export async function createRecord(Model, fields) {
  if (typeof Model.create === 'function') return Model.create(fields);
  const doc = new Model(fields);
  await doc.save();
  return doc;
}

export function sendError(res, error, fallback = 'Server Error') {
  const status = error?.status === 400 || error?.status === 401 ? error.status : error?.name === 'ValidationError' || error?.name === 'CastError' ? 400 : 500;
  if (status === 500) console.error('[records]', error?.message);
  res.status(status).json({ success: false, message: status === 500 ? fallback : error.message });
}
