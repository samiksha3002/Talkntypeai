// This flag exposes readiness information only. It never bypasses conversion/export guards.
export function legacyFontPreviewEnabled(env = {}) {
  return env.DEV === true && env.PROD !== true && env.VITE_LEGACY_FONT_PREVIEW === 'true';
}
