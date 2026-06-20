/**
 * fontConverterUtils.js
 * ─────────────────────────────────────────────────────────────────
 * All font conversions in one place.
 *
 * Supported conversions:
 *   unicode-to-krutidev   — Marathi/Hindi Unicode → KrutiDev
 *   unicode-to-shivaji    — Marathi/Hindi Unicode → Shivaji
 *   krutidev-to-unicode   — KrutiDev → Unicode  (via npm library)
 *   shivaji-to-unicode    — Shivaji  → Unicode  (via npm library)
 *   preeti-to-unicode     — Preeti   → Unicode
 *   mangal-to-krutidev    — Mangal (Unicode font) → KrutiDev
 *   mangal-to-unicode     — Mangal (Unicode font) → normalised Unicode
 *
 * File location: src/utils/fontConverterUtils.js
 *   (or wherever you keep shared utilities in your Express project)
 * ─────────────────────────────────────────────────────────────────
 */

import kru2uni from "@anthro-ai/krutidev-unicode";

/* ================================================================== */
/* SHARED HELPERS                                                       */
/* ================================================================== */

/** Strip HTML tags and normalise whitespace — used before every conversion */
function preProcess(text) {
  let t = text;
  t = t.replace(/<\/p>/gi, "\n");     // paragraph end → newline
  t = t.replace(/<br\s*\/?>/gi, "\n"); // <br> → newline
  t = t.replace(/<[^>]+>/g, "");      // strip remaining HTML tags
  t = t.replace(/&nbsp;/g, " ");
  t = t.replace(/\u00A0/g, " ");
  return t;
}

/* ================================================================== */
/* 1. Unicode → KrutiDev                                               */
/*    (Marathi / Hindi Unicode Devanagari → KrutiDev legacy encoding) */
/* ================================================================== */

export function unicodeToKrutidev(sourceText) {
  if (!sourceText) return "";
  let text = preProcess(sourceText);

  // ── STEP 0: Join split conjuncts that arrive with stray halant spaces ──
  text = text.replace(/द्\s*्\s*ध/g, "द्ध");
  text = text.replace(/त्\s*्\s*त/g, "त्त");
  text = text.replace(/द\s*्\s*द/g, "द्द");
  text = text.replace(/ट\s*्\s*ट/g, "ट्ट");
  text = text.replace(/ड\s*्\s*ड/g, "ड्ड");
  text = text.replace(/ड\s*्\s*ढ/g, "ड्ढ");
  text = text.replace(/द\s*्\s*य/g, "द्य");
  text = text.replace(/ह\s*्\s*म/g, "ह्म");
  text = text.replace(/ल\s*्\s*ल/g, "ल्ल");

  // ── STEP 0.5: Complex conjuncts — MUST come before generic Ra logic ──
  text = text.replace(/श्वा/g, "Üok");
  text = text.replace(/श्व/g, "Üo");
  text = text.replace(/र्थ्य/g, "F;k±");
  text = text.replace(/र्थ/g, "FkZ");
  text = text.replace(/दृ/g, "n`");
  text = text.replace(/ल्ल/g, "Yy");
  text = text.replace(/द्व/g, "}");
  text = text.replace(/द\s*्\s*व/g, "}");
  text = text.replace(/ह्य/g, "g~;");
  text = text.replace(/ह\s*्\s*य/g, "g~;");

  // ── STEP 1: Reph (र्) logic — र् before a consonant → consonant + Z ──
  text = text.replace(/र्([क-ह])/g, "$1Z");

  // Move Z past any matras that follow the consonant
  const matras = "ािीुूृेैोौं:ँॅ";
  const zRegex = new RegExp(`Z([${matras}])`, "g");
  text = text.replace(zRegex, "$1Z");
  text = text.replace(zRegex, "$1Z"); // second pass handles double matras

  // ── STEP 2: Chhoti i (ि) — must move left of its base consonant ──
  let pos = text.indexOf("ि");
  while (pos !== -1) {
    const left      = text.charAt(pos - 1);
    const leftPrev  = text.charAt(pos - 2);
    if (leftPrev === "्") {
      const base    = text.charAt(pos - 3);
      const find    = base + "्" + left + "ि";
      text = text.replace(find, "f" + base + "्" + left);
    } else {
      text = text.replace(left + "ि", "f" + left);
    }
    pos = text.search(/ि/, pos + 1);  // search again from current position
  }

  // ── STEP 3: Main character map ──
  const FROM = [
    // Punctuation / symbols
    "\u2018", "\u2019", "\u201C", "\u201D",
    "(", ")", "{", "}", "=", "।", "?", "-", "µ", "॰", ",", ".", "् ",
    // Devanagari digits
    "०","१","२","३","४","५","६","७","८","९",
    "x",
    // Conjuncts / ligatures (longest first to avoid partial match)
    "द्ध","ट्ट","ट्ठ","ड्ढ",
    "क्र","प्र","द्र","म्र","ग्र","ब्र","स्र",
    "त्र","क्ष","ज्ञ","श्र","त्त","क्त",
    "ह्न","ह्य","हृ","ह्म","द्य",
    "ट्र","ड्र","श्व",
    // Half consonants (halant forms)
    "क्","ख्","ग्","घ्","ङ्",
    "च्","छ्","ज्","झ्","ञ्",
    "ट्","ठ्","ड्","ढ्","ण्",
    "त्","थ्","द्","ध्","न्",
    "प्","फ्","ब्","भ्","म्",
    "य्","र्","ल्","व्","श्","ष्","स्","ह्",
    // Matras
    "ा","ि","ी","ु","ू","ृ","े","ै","ो","ौ","ं","ँ","ः","ॅ","ऽ","़",
    // Independent vowels
    "अ","आ","इ","ई","उ","ऊ","ऋ","ए","ऐ","ओ","औ","अं","अः",
    // Consonants
    "क","ख","ग","घ","ङ","च","छ","ज","झ","ञ",
    "ट","ठ","ड","ढ","ण","त","थ","द","ध","न",
    "प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह",
    // Misc
    "्","ळ"
  ];

  const TO = [
    "^","*","Þ","ß",
    "¼","½","¿","À","¾","A","\\","&","&","A","]","A","~ ",
    "0","1","2","3","4","5","6","7","8","9",
    "N",
    ")","ê","ë","ï",
    "Ø","iz","nz","ez","xz","cz","lz",
    "=","{k","K","Jh","Ù","Dr",
    "à","á","º","ã","|",
    "Vª","Mª","Üo",
    "D","[","X","¿","?",
    "P","N","T",">","¥",
    "V","B","M","<",".k",
    "R","F","n","/","U",
    "i","Q","c","H","e",
    "¸","j","y","o","'","\"","L","g",
    "k","f","h","q","w","`","s","S","ks","kS","a","¡","%","W","·","¸",
    "v","vk","b","bZ","m","Å","_",",","S","vks","vkS","va","v%",
    "d","[k","x","?k","?","p","N","t",">","¥",
    "V","B","M","<",".k","r","Fk","n","/","u",
    "i","Q","c","Hk","e",";","j","y","o","'k","\"k","l","g",
    "~","G"
  ];

  for (let i = 0; i < FROM.length; i++) {
    if (text.includes(FROM[i])) {
      text = text.split(FROM[i]).join(TO[i]);
    }
  }
  return text;
}

// Alias: Mangal is a Unicode font → same as unicodeToKrutidev
export const mangalToKrutidev = unicodeToKrutidev;

/* ================================================================== */
/* 2. Unicode → Shivaji                                                */
/*    (Marathi Unicode Devanagari → Shivaji legacy encoding)          */
/* ================================================================== */

export function unicodeToShivaji(sourceText) {
  if (!sourceText) return "";
  let text = preProcess(sourceText);

  // ── STEP 0: Join split conjuncts ──
  text = text.replace(/द्\s*्\s*ध/g, "द्ध");
  text = text.replace(/त्\s*्\s*त/g, "त्त");
  text = text.replace(/द\s*्\s*द/g, "द्द");
  text = text.replace(/द\s*्\s*य/g, "द्य");
  text = text.replace(/ह\s*्\s*म/g, "ह्म");

  // ── STEP 1: Reph ──
  text = text.replace(/र्([क-ह])/g, "$1Z");
  const matras = "ािीुूृेैोौं:ँॅ";
  const zRegex = new RegExp(`Z([${matras}])`, "g");
  text = text.replace(zRegex, "$1Z");
  text = text.replace(zRegex, "$1Z");

  // ── STEP 2: Chhoti i ──
  let pos = text.indexOf("ि");
  while (pos !== -1) {
    const left     = text.charAt(pos - 1);
    const leftPrev = text.charAt(pos - 2);
    if (leftPrev === "्") {
      const base = text.charAt(pos - 3);
      text = text.replace(base + "्" + left + "ि", "f" + base + "्" + left);
    } else {
      text = text.replace(left + "ि", "f" + left);
    }
    pos = text.search(/ि/, pos + 1);
  }

  // ── STEP 3: Shivaji character map ──
  const FROM = [
    "\u2018","\u2019","\u201C","\u201D",
    "(",")","{","}","=","।","?","-","µ","॰",",",".","् ",
    "०","१","२","३","४","५","६","७","८","९",
    "x",
    // Conjuncts
    "द्ध","ट्ट","ट्ठ","ड्ढ",
    "क्र","प्र","द्र","म्र","ग्र","ब्र","स्र",
    "त्र","क्ष","ज्ञ","श्र","त्त","क्त","दृ","कृ",
    "ह्न","ह्य","हृ","ह्म","द्य",
    "ट्र","ड्र","श्व","द्व",
    // Half consonants
    "क्","ख्","ग्","घ्","ङ्",
    "च्","छ्","ज्","झ्","ञ्",
    "ट्","ठ्","ड्","ढ्","ण्",
    "त्","थ्","द्","ध्","न्",
    "प्","फ्","ब्","भ्","म्",
    "य्","र्","ल्","व्","श्","ष्","स्","ह्",
    // Marathi-specific
    "ळ","ॐ","ऱ",
    // Matras
    "ा","ि","ी","ु","ू","ृ","े","ै","ो","ौ","ं","ँ","ः","ॅ","ऽ","़",
    // Independent vowels
    "अ","आ","इ","ई","उ","ऊ","ऋ","ए","ऐ","ओ","औ","अं","अः",
    // Consonants
    "क","ख","ग","घ","ङ","च","छ","ज","झ","ञ",
    "ट","ठ","ड","ढ","ण","त","थ","द","ध","न",
    "प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह",
    "्"
  ];

  const TO = [
    "^","*","Þ","ß",
    "¼","½","¿","À","¾","A","\\","&","&","A","]","-","~ ",
    "0","1","2","3","4","5","6","7","8","9",
    "N",
    "ð","ê","ë","ï",
    "Ø","iz","nz","ez","xz","cz","lz",
    "=","{k","K","Jh","Ù","Dr","—","—",
    "à","á","º","ã","|",
    "Vª","Mª","Üo","n~o",
    "D","[","X","¿","?",
    "P","N","T",">","¥",
    "V","B","M","<",".",   // ण् → "." in Shivaji (not ".k")
    "R","F","n","/","U",
    "I","Q","C","H","E",   // Shivaji half-consonants differ from KrutiDev
    "¸","j","Y","O","'","\"","L","g",  // ल् → Y, व् → O in Shivaji
    "Ø","†","J",
    "k","f","h","q","w","`","s","S","ks","kS","a","¡","%","W","·","¸",
    "v","vk","b","bZ","m","Å","_",",","S","vks","vkS","va","v%",
    "d","[k","x","?k","?","p","N","t",">","¥",
    "V","B","M","<",".k","r","Fk","n","/","u",
    "i","Q","c","Hk","e",";","j","y","o","'k","\"k","l","g",
    "~"
  ];

  for (let i = 0; i < FROM.length; i++) {
    if (text.includes(FROM[i])) {
      text = text.split(FROM[i]).join(TO[i]);
    }
  }
  return text;
}

/* ================================================================== */
/* 3. KrutiDev → Unicode  (via @anthro-ai/krutidev-unicode)           */
/* ================================================================== */

export function krutidevToUnicode(text) {
  if (!text) return "";
  return kru2uni(text);
}

/* ================================================================== */
/* 4. Shivaji → Unicode                                                */
/*    Shivaji shares most characters with KrutiDev except for a few   */
/*    Marathi-specific keys. We normalise those then pass to kru2uni. */
/* ================================================================== */

export function shivajiToUnicode(text) {
  if (!text) return "";

  // Shivaji-specific keys that differ from KrutiDev — patch them first
  let t = text;
  t = t.replace(/ð/g,  ")")   // Shivaji द्ध  → KrutiDev )
  t = t.replace(/n~o/g, "}")  // Shivaji द्व   → KrutiDev }
  t = t.replace(/†/g,  "ॐ")  // Shivaji OM symbol
  t = t.replace(/J/g,  "ऱ")  // Shivaji eyelash-ra
  t = t.replace(/I/g,  "i")   // half प (Shivaji I → KrutiDev i)
  t = t.replace(/C/g,  "c")   // half ब (Shivaji C → KrutiDev c)
  t = t.replace(/E/g,  "e")   // half म (Shivaji E → KrutiDev e)
  t = t.replace(/Y/g,  "y")   // half ल (Shivaji Y → KrutiDev y)
  t = t.replace(/O/g,  "o")   // half व (Shivaji O → KrutiDev o)
  // Now convert as KrutiDev
  return kru2uni(t);
}

/* ================================================================== */
/* 5. Preeti → Unicode                                                 */
/*    Preeti is a Nepali font with a completely different key layout.  */
/* ================================================================== */

export function preetiToUnicode(sourceText) {
  if (!sourceText) return "";
  let text = preProcess(sourceText);

  // Sorted longest-match map for Preeti → Unicode
  const MAP = [
    // Multi-char sequences first
    [":=", "थ"], ["km", "फ"], ["em", "झ"],
    ["cf]","ओ"], ["{]","औ"], ["cf","ि"], ["If","ी"],
    // Single chars
    ["v","अ"], ["g","आ"], ["O","इ"], ["{","ई"],
    ["=","उ"],["+","ऊ"], ["s","ए"], ["P","ऐ"],
    ["]","ो"],  // combined with cf] already handled above
    ["k","प"],["K","फ"],["a","ब"],["e","भ"],["d","म"],
    ["r","च"],["5","छ"],["h","ज"],["~","ञ"],
    ["6","ट"],["7","ठ"],["8","ड"],["9","ढ"],["0","ण"],
    ["t","त"],["b","द"],["w","ध"],["g","न"],
    ["u","ग"],["3","घ"],[";","ङ"],
    ["o","य"],["/","र"],["n","ल"],["j","व"],
    ["z","श"],["if","ष"],[";","स"],["x","ह"],
    ["c","क"],["v","ख"],
    // Matras
    ["-","ा"],["f","ि"],["L","ी"],["'","ु"],["\"","ू"],
    ["{","े"],["}", "ै"],
    ["F","ं"],["M","ः"],[";","ँ"],["\\","्"],
    [".", "।"],
  ];

  // Sort by key length descending (longest first)
  MAP.sort((a, b) => b[0].length - a[0].length);

  for (const [from, to] of MAP) {
    text = text.split(from).join(to);
  }
  return text;
}

/* ================================================================== */
/* 6. Mangal → Unicode                                                 */
/*    Mangal IS a Unicode Devanagari font — text is already Unicode.  */
/*    Just NFC-normalise and strip any HTML.                          */
/* ================================================================== */

export function mangalToUnicode(text) {
  if (!text) return "";
  return preProcess(text).normalize("NFC");
}

/* ================================================================== */
/* DISPATCHER — single entry point used by the Express route           */
/* ================================================================== */

export const SUPPORTED_CONVERSIONS = {
  "unicode-to-krutidev":  { fn: unicodeToKrutidev,  label: "Unicode (Marathi/Hindi) → KrutiDev" },
  "unicode-to-shivaji":   { fn: unicodeToShivaji,   label: "Unicode (Marathi/Hindi) → Shivaji"  },
  "krutidev-to-unicode":  { fn: krutidevToUnicode,  label: "KrutiDev → Unicode"                 },
  "shivaji-to-unicode":   { fn: shivajiToUnicode,   label: "Shivaji → Unicode"                  },
  "preeti-to-unicode":    { fn: preetiToUnicode,    label: "Preeti → Unicode"                   },
  "mangal-to-krutidev":   { fn: mangalToKrutidev,   label: "Mangal → KrutiDev"                  },
  "mangal-to-unicode":    { fn: mangalToUnicode,    label: "Mangal → Unicode"                   },
};

export function convert(conversionType, text) {
  const entry = SUPPORTED_CONVERSIONS[conversionType];
  if (!entry) {
    throw new Error(
      `Unsupported conversion: "${conversionType}". ` +
      `Supported: ${Object.keys(SUPPORTED_CONVERSIONS).join(", ")}`
    );
  }
  return entry.fn(text);
}