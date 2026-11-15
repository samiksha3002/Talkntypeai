// Fail closed until exact-font mapping coverage and font-use rights are verified.
// Mangal is a Unicode typeface, not another encoding. See docs/legacy-font-readiness.md.
export function legacyFontUnavailable(font) {
  const family = String(font || '').split(',')[0].replace(/["']/g, '').trim();
  if (/^preeti$/i.test(family)) return 'Preeti is unavailable: the exact licensed font asset and Marathi/Hindi mapping coverage have not been verified. Your document is retained.';
  if (/^shivaji(?:0?[125])?$/i.test(family)) return 'Shivaji is unavailable: the Shivaji01/Shusha 1.5 mapping and font-use license have not been verified. Your document is retained.';
  return '';
}
export function conversionUnavailable(type) {
  if (/^(?:(?:unicode|mangal)-to-(?:preeti|shivaji)|(?:preeti|shivaji)-to-unicode)$/.test(type || '')) {
    return legacyFontUnavailable(type.includes('preeti') ? 'Preeti' : 'Shivaji01');
  }
  return '';
}
