/**
 * fontConverterUtils.js
 * ─────────────────────────────────────────────────────────────────
 * Centralised font-conversion logic for:
 *   - KrutiDev  → Unicode (Devanagari)
 *   - Unicode   → KrutiDev
 *   - Shivaji   → Unicode
 *   - Preeti    → Unicode
 *   - Mangal    → KrutiDev
 *   - Mangal    → Unicode
 *
 * Each converter is a pure function: (text: string) => string
 * ─────────────────────────────────────────────────────────────────
 */

/* ------------------------------------------------------------------ */
/* 1. KrutiDev → Unicode                                               */
/* Using @anthro-ai/krutidev-unicode (battle-tested dictionary)        */
/* ------------------------------------------------------------------ */
import kru2uni from "@anthro-ai/krutidev-unicode";

export function krutidevToUnicode(text) {
  return kru2uni(text);
}

/* ------------------------------------------------------------------ */
/* 2. Unicode → KrutiDev                                               */
/* Reverse-mapped from the same dictionary, longest-match first        */
/* ------------------------------------------------------------------ */

// Core Unicode → KrutiDev lookup table (Devanagari codepoints)
const UNICODE_TO_KRUTIDEV_MAP = [
  // Vowels (independent)
  ["अ", "v"],  ["आ", "vk"],  ["इ", "b"],   ["ई", "bZ"],
  ["उ", "m"],  ["ऊ", "Å"],   ["ऋ", "_.k"], ["ए", ","],
  ["ऐ", "S"],  ["ओ", "vks"], ["औ", "vkS"],
  // Vowel matras
  ["ा", "k"],  ["ि", "f"],   ["ी", "h"],   ["ु", "q"],
  ["ू", "w"],  ["ृ", ""],    ["े", "s"],   ["ै", "S"],
  ["ो", "ks"], ["ौ", "kS"],  ["ं", "a"],   ["ः", "A"],
  ["ँ", "¡"],  ["्", "~"],
  // Consonants
  ["क", "d"],  ["ख", "["],  ["ग", "x"],  ["घ", "?k"], ["ङ", "³"],
  ["च", "p"],  ["छ", "N"],  ["ज", "t"],  ["झ", ">k"],  ["ञ", "´"],
  ["ट", "V"],  ["ठ", "B"],  ["ड", "M"], ["ढ", "<"], ["ण", "."  ],
  ["त", "r"],  ["थ", "Fk"], ["द", "n"],  ["ध", "/k"],  ["न", "u"],
  ["प", "i"],  ["फ", "Q"],  ["ब", "c"],  ["भ", "Hk"],  ["म", "e"],
  ["य", ";"],  ["र", "j"],  ["ल", "y"],  ["व", "o"],
  ["श", "'k"], ["ष", "\""], ["स", "l"],  ["ह", "g"],
  ["ळ", "G"],  ["क्ष", "{"], ["त्र", "="], ["ज्ञ", "K"],
  // Numbers
  ["०", "å"],  ["१", "ƒ"],  ["२", "„"],  ["३", "…"],
  ["४", "†"],  ["५", "‡"],  ["६", "ˆ"],  ["७", "‰"],
  ["८", "Š"],  ["९", "‹"],
  // Special
  ["।", "A"], ["ॐ", "ÅWa"],
  // Nuktated consonants
  ["क़", "d+"], ["ख़", "[+k"], ["ग़", "x+"],
  ["ज़", "t+"], ["ड़", "M+"], ["ढ़", "<+"],
  ["फ़", "Q+"], ["य़", ";+"], ["ऱ", "j+"],
];

export function unicodeToKrutidev(text) {
  // Sort by Unicode string length (desc) for longest-match replacement
  const sortedMap = [...UNICODE_TO_KRUTIDEV_MAP].sort(
    (a, b) => b[0].length - a[0].length
  );

  let result = text;
  for (const [uni, kru] of sortedMap) {
    result = result.split(uni).join(kru);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* 3. Shivaji → Unicode                                                */
/* Shivaji is a Marathi legacy font with a different key layout.       */
/* Mapping covers the full Shivaji font character set.                 */
/* ------------------------------------------------------------------ */

const SHIVAJI_TO_UNICODE_MAP = [
  // Two-char combinations FIRST (longest match)
  ["vks", "ओ"], ["vkS", "औ"], ["vk", "आ"],
  ["bZ", "ई"],  ["=k", "त्र"], ["{k", "क्षि"],
  ["ks", "ो"], ["kS", "ौ"],
  // Independent vowels
  ["v", "अ"], ["b", "इ"], ["m", "उ"], ["Å", "ऊ"],
  [",", "ए"], ["S", "ऐ"],
  // Matras
  ["k", "ा"], ["f", "ि"], ["h", "ी"],
  ["q", "ु"], ["w", "ू"], ["s", "े"],
  ["a", "ं"], ["A", "ः"], ["¡", "ँ"], ["~", "्"],
  // Consonants
  ["d", "क"], ["[", "ख"], ["x", "ग"], ["?", "घ"], ["³", "ङ"],
  ["p", "च"], ["N", "छ"], ["t", "ज"], [">", "झ"], ["´", "ञ"],
  ["V", "ट"], ["B", "ठ"], ["M", "ड"], ["<", "ढ"], [".", "ण"],
  ["r", "त"], ["F", "थ"], ["n", "द"], ["/", "ध"], ["u", "न"],
  ["i", "प"], ["Q", "फ"], ["c", "ब"], ["H", "भ"], ["e", "म"],
  [";", "य"], ["j", "र"], ["y", "ल"], ["o", "व"],
  ["'", "श"], ["\"", "ष"], ["l", "स"], ["g", "ह"],
  ["G", "ळ"], ["K", "ज्ञ"],
  // Numbers
  ["å", "०"], ["ƒ", "१"], ["„", "२"], ["…", "३"],
  ["†", "४"], ["‡", "५"], ["ˆ", "६"], ["‰", "७"],
  ["Š", "८"], ["‹", "९"],
  ["A", "।"],
];

export function shivajiToUnicode(text) {
  const sortedMap = [...SHIVAJI_TO_UNICODE_MAP].sort(
    (a, b) => b[0].length - a[0].length
  );

  let result = text;
  for (const [shivaji, uni] of sortedMap) {
    result = result.split(shivaji).join(uni);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* 4. Preeti → Unicode                                                 */
/* Preeti is a Nepali legacy font; different layout from KrutiDev.    */
/* ------------------------------------------------------------------ */

const PREETI_TO_UNICODE_MAP = [
  // Two-char combos first
  ["cf", "ि"], ["If", "ी"],
  // Independent vowels
  ["c", "क"], ["v", "अ"], ["g", "आ"], ["O", "इ"], ["{ ", "ई"],
  ["=", "उ"], ["+", "ऊ"], ["s", "ए"], ["P", "ऐ"],
  ["cf]", "ओ"], ["{]", "औ"],
  // Consonants
  ["s", "क"], ["v", "ख"], ["u", "ग"], ["3", "घ"], [";", "ङ"],
  ["r", "च"], ["5", "छ"], ["h", "ज"], ["em", "झ"], ["~", "ञ"],
  ["6", "ट"], ["7", "ठ"], ["8", "ड"], ["9", "ढ"], ["0", "ण"],
  ["t", "त"], [":=", "थ"], ["b", "द"], ["w", "ध"], ["g", "न"],
  ["k", "प"], ["km", "फ"], ["a", "ब"], ["e", "भ"], ["d", "म"],
  ["o", "य"], ["/", "र"], ["n", "ल"], ["j", "व"],
  ["z", "श"], ["if", "ष"], [";", "स"], ["x", "ह"],
  // Matras
  ["-", "ा"], ["f", "ि"], ["L", "ी"], ["'", "ु"], ["\"", "ू"],
  ["{", "े"], ["}", "ै"], ["{]", "ो"], ["}", "ौ"],
  ["F", "ं"], ["M", "ः"], [";", "ँ"], ["\\", "्"],
  // Punctuation
  [".", "।"],
];

export function preetiToUnicode(text) {
  const sortedMap = [...PREETI_TO_UNICODE_MAP].sort(
    (a, b) => b[0].length - a[0].length
  );

  let result = text;
  for (const [preeti, uni] of sortedMap) {
    result = result.split(preeti).join(uni);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* 5. Mangal → KrutiDev                                                */
/* Mangal is a Unicode Devanagari font (not a legacy encoding).        */
/* Mangal text IS Unicode, so Mangal → KrutiDev = Unicode → KrutiDev  */
/* ------------------------------------------------------------------ */

export function mangalToKrutidev(text) {
  return unicodeToKrutidev(text);
}

/* ------------------------------------------------------------------ */
/* 6. Mangal → Unicode                                                 */
/* Mangal is already Unicode/Devanagari — returns as-is               */
/* ------------------------------------------------------------------ */

export function mangalToUnicode(text) {
  // Mangal is a Unicode font — the text encoding IS Unicode Devanagari.
  // No conversion needed; we return it normalised to NFC.
  return text.normalize("NFC");
}

/* ------------------------------------------------------------------ */
/* Dispatcher — single entry point used by the route                   */
/* ------------------------------------------------------------------ */

export const SUPPORTED_CONVERSIONS = {
  "krutidev-to-unicode": { fn: krutidevToUnicode, label: "KrutiDev → Unicode" },
  "unicode-to-krutidev": { fn: unicodeToKrutidev, label: "Unicode → KrutiDev" },
  "shivaji-to-unicode":  { fn: shivajiToUnicode,  label: "Shivaji → Unicode"  },
  "preeti-to-unicode":   { fn: preetiToUnicode,   label: "Preeti → Unicode"   },
  "mangal-to-krutidev":  { fn: mangalToKrutidev,  label: "Mangal → KrutiDev"  },
  "mangal-to-unicode":   { fn: mangalToUnicode,   label: "Mangal → Unicode"   },
};

export function convert(conversionType, text) {
  const entry = SUPPORTED_CONVERSIONS[conversionType];
  if (!entry) {
    throw new Error(`Unsupported conversion: "${conversionType}"`);
  }
  return entry.fn(text);
}