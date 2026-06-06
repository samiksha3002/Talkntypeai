// frontend/src/components/utils/formatters.js
// ─────────────────────────────────────────────────────────────────────────────
// Fix applied: moved to src/components/utils/ to match JudgementsPage import:
//   import { ... } from '../components/utils/formatters'
// ─────────────────────────────────────────────────────────────────────────────

// ── Date ──────────────────────────────────────────────────────────────────────
export function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Court name → short label + Tailwind style ─────────────────────────────────
const COURT_MAP = {
  'Supreme Court of India' : { label: 'SC India',     style: 'bg-red-950/25 text-red-300'  },
  'Delhi High Court'       : { label: 'Delhi HC',     style: 'bg-blue-950/35 text-blue-300' },
  'Bombay High Court'      : { label: 'Bombay HC',    style: 'bg-blue-950/35 text-blue-300' },
  'Calcutta High Court'    : { label: 'Calcutta HC',  style: 'bg-blue-950/35 text-blue-300' },
  'Madras High Court'      : { label: 'Madras HC',    style: 'bg-blue-950/35 text-blue-300' },
  'Allahabad High Court'   : { label: 'Allahabad HC', style: 'bg-blue-950/35 text-blue-300' },
  'Karnataka High Court'   : { label: 'Karnataka HC', style: 'bg-blue-950/35 text-blue-300' },
  'Gujarat High Court'     : { label: 'Gujarat HC',   style: 'bg-blue-950/35 text-blue-300' },
  'Kerala High Court'      : { label: 'Kerala HC',    style: 'bg-blue-950/35 text-blue-300' },
  'Patna High Court'       : { label: 'Patna HC',     style: 'bg-blue-950/35 text-blue-300' },
};

export function getCourtInfo(courtName) {
  if (!courtName) return { label: 'Unknown', style: 'bg-gray-800/20 text-gray-400' };

  if (COURT_MAP[courtName]) return COURT_MAP[courtName];

  // Partial match
  for (const [key, val] of Object.entries(COURT_MAP)) {
    if (courtName.includes(key) || key.includes(courtName)) return val;
  }

  // Fallback: shorten automatically
  const label = courtName
    .replace(' High Court', ' HC')
    .replace(' Court of India', '');
  return { label, style: 'bg-gray-800/20 text-gray-400' };
}

// ── Subject / doctype tag style ───────────────────────────────────────────────
const TAG_STYLES = {
  Constitutional : 'bg-yellow-900/15 text-yellow-400',
  Criminal       : 'bg-purple-950/25 text-purple-300',
  Civil          : 'bg-green-950/25 text-green-300',
  Labour         : 'bg-teal-950/25 text-teal-300',
  Tax            : 'bg-orange-950/25 text-orange-300',
  Family         : 'bg-pink-950/25 text-pink-300',
};

export function getTagStyle(tag) {
  if (!tag) return 'bg-gray-800/20 text-gray-400';
  for (const [key, style] of Object.entries(TAG_STYLES)) {
    if (tag.toLowerCase().includes(key.toLowerCase())) return style;
  }
  return 'bg-gray-800/20 text-gray-400';
}

// ── Truncate ──────────────────────────────────────────────────────────────────
export function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}