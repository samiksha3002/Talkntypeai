/**
 * fontConverterUtils.js  — v5 FINAL
 * ─────────────────────────────────────────────────────────────────
 * Location : utils/fontConverterUtils.js  (backend, same level as routes/)
 *
 * Supported conversions (3 output fonts only):
 *   unicode-to-krutidev  — Hindi/Marathi Unicode → KrutiDev
 *   unicode-to-shivaji   — Hindi/Marathi Unicode → Shivaji
 *   unicode-to-preeti    — Hindi/Marathi Unicode → Preeti
 *   krutidev-to-unicode  — KrutiDev → Unicode
 *   shivaji-to-unicode   — Shivaji  → Unicode
 *   mangal-to-krutidev   — Mangal (is Unicode) → KrutiDev
 *   mangal-to-unicode    — Mangal → normalised Unicode
 *
 * Bug fixes vs original:
 *  1. ध+matra  : "/" = ध् in library, so full ध needs "/k". Pre-patched.
 *  2. थ+matra  : "Fk" = थ् in library, so full था = "Fkk" etc. Pre-patched.
 *  3. धि / थि  : chhoti-i (f) must appear BEFORE consonant → f/k, fFk
 *  4. Half ब्  : "C" not "c"  |  Half व् : "O" not "o"
 *  5. रू       : ":" (colon) in KrutiDev, not "jw"
 *  6. Half क्ष : "{" — pre-patched BEFORE main map to avoid brace clash
 *  7. ड् before consonant (षड्यंत्र) : "M~" not "M"
 *  8. त्त+ि (संपत्ति) : half-त (R) + ति (fr) = "Rfr", triggers via "त्+ति" pre-patch
 *  9. Reph+Anuswara order: Za → aZ  (शर्तों = 'krksaZ not 'krksZa)
 * ─────────────────────────────────────────────────────────────────
 */

import kru2uni from "@anthro-ai/krutidev-unicode";

/* ──────────────────────────────────────────────────────────────── */
/* SHARED HELPER                                                    */
/* ──────────────────────────────────────────────────────────────── */
function preProcess(text) {
  return text
    .replace(/<\/p>/gi,    "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g,  "")
    .replace(/&nbsp;/g,   " ")
    .replace(/\u00A0/g,   " ");
}

/* ──────────────────────────────────────────────────────────────── */
/* 1.  Unicode  →  KrutiDev                                        */
/* ──────────────────────────────────────────────────────────────── */
export function unicodeToKrutidev(sourceText) {
  if (!sourceText) return "";
  let text = preProcess(sourceText);

  /* ── STEP 0 : Normalise stray split conjuncts ── */
  text = text.replace(/द्\s*्\s*ध/g,  "द्ध");
  text = text.replace(/त्\s*्\s*त/g,  "त्त");
  text = text.replace(/द\s*्\s*द/g,   "द्द");
  text = text.replace(/ट\s*्\s*ट/g,   "ट्ट");
  text = text.replace(/ड\s*्\s*ड/g,   "ड्ड");
  text = text.replace(/ड\s*्\s*ढ/g,   "ड्ढ");
  text = text.replace(/द\s*्\s*य/g,   "द्य");
  text = text.replace(/ह\s*्\s*म/g,   "ह्म");
  text = text.replace(/ल\s*्\s*ल/g,   "ल्ल");

  /* ── STEP 0.5 : Complex conjuncts (before Reph) ── */
  text = text.replace(/श्वा/g,  "Üok");
  text = text.replace(/श्व/g,   "Üo");
  text = text.replace(/र्थ्य/g, "F;k±");
  text = text.replace(/र्थि/g,  "fFkZ");   // reph+tha+chhoti-i (e.g. आर्थिक)
  text = text.replace(/र्थ/g,   "FkZ");
  text = text.replace(/दृ/g,    "n`");
  text = text.replace(/ल्ल/g,   "Yy");
  text = text.replace(/द्व/g,   "}");
  text = text.replace(/ह्य/g,   "g~;");

  /* ── STEP 0.6 : Half-क्ष pre-patch  (MUST be before main map) ──
     The main map maps "{" → "¿" (open-bracket), so half क्ष
     must be converted to the KrutiDev "{" here — after which the
     main map will NOT overwrite it because we remove "{" from FROM. */
  text = text.replace(/क्ष्/g, "{");   // half ksha

  /* ── STEP 0.7 : ड् + consonant → M~ (e.g. षड्यंत्र) ──
     KrutiDev "M" = ड, "M~" = ड् when followed by another consonant. */
  text = text.replace(/ड्([क-ह])/g, "M~$1");

  /* ── STEP 0.8 : त्त + ि  →  Rfr  (e.g. संपत्ति) ──
     The त्त ligature (Ù) + ि cannot be processed by the chhoti-i loop
     correctly. Pre-patch the whole cluster. */
  text = text.replace(/त्ति/g, "Rfr");   // half-त(R) + ति(fr)
  text = text.replace(/त्ती/g, "Rfh");   // half-त(R) + ती

  /* ── STEP 0.9 : ध + matra pre-patch ──
     The KrutiDev library treats "/" as "ध्" (with implicit halant).
     So a full ध (with any vowel or at word-end) MUST be "/k".
     धि = f/k  (chhoti-i already placed left of /k here).          */
  text = text.replace(/धो/g,  "/ks");
  text = text.replace(/धौ/g,  "/kS");
  text = text.replace(/धा/g,  "/kk");
  text = text.replace(/धि/g,  "f/k");   // ← f is placed left here
  text = text.replace(/धी/g,  "/kh");
  text = text.replace(/धु/g,  "/kq");
  text = text.replace(/धू/g,  "/kw");
  text = text.replace(/धे/g,  "/ks");
  text = text.replace(/धै/g,  "/kS");
  text = text.replace(/धं/g,  "/ka");
  text = text.replace(/धः/g,  "/k%");
  text = text.replace(/ध्/g,  "/");      // half ध
  // full bare ध (before space / punct / end-of-string)
  text = text.replace(/ध(?=[^ािीुूृेैोौंःँॅ]|$)/g, "/k");

  /* ── STEP 0.10 : थ + matra pre-patch ──
     "Fk" in KrutiDev = "थ्" (with implicit halant).
     Full था = "Fkk", थि = "fFk", etc.                              */
  text = text.replace(/थो/g,  "Fkks");
  text = text.replace(/थौ/g,  "FkkS");
  text = text.replace(/था/g,  "Fkk");
  text = text.replace(/थि/g,  "fFk");   // ← f placed left
  text = text.replace(/थी/g,  "Fkh");
  text = text.replace(/थु/g,  "Fkq");
  text = text.replace(/थू/g,  "Fkw");
  text = text.replace(/थे/g,  "Fks");
  text = text.replace(/थै/g,  "FkS");
  text = text.replace(/थं/g,  "Fka");
  text = text.replace(/थः/g,  "Fk%");
  text = text.replace(/थ्/g,  "F");     // half थ
  text = text.replace(/थ(?=[^ािीुूृेैोौंःँॅ]|$)/g, "Fk");

  /* ── STEP 0.11 : रू = ":" ── */
  text = text.replace(/रू/g, ":");

  /* ── STEP 1 : Reph  र् → consonant + Z ── */
  text = text.replace(/र्([क-ह])/g, "$1Z");

  // Move Z past any matra(s) that follow the consonant
  const matras  = "ािीुूृेैोौं:ँॅ";
  const zRegex  = new RegExp(`Z([${matras}])`, "g");
  text = text.replace(zRegex, "$1Z");
  text = text.replace(zRegex, "$1Z");
  // FIX: Z must come AFTER anuswara  (शर्तों = 'krksaZ not 'krksZa)
  text = text.replace(/Za/g, "aZ");

  /* ── STEP 2 : Chhoti i (ि) — move left of its base consonant ──
     Only processes remaining Unicode ि chars; धि/थि are already ASCII. */
  let pos = text.indexOf("ि");
  while (pos !== -1) {
    const left    = text.charAt(pos - 1);
    const leftPrev = text.charAt(pos - 2);
    if (leftPrev === "्") {
      const base  = text.charAt(pos - 3);
      text = text.replace(base + "्" + left + "ि", "f" + base + "्" + left);
    } else {
      text = text.replace(left + "ि", "f" + left);
    }
    pos = text.search(/ि/, pos + 1);
  }

  /* ── STEP 3 : Main character map ──
     NOTES:
     • "{" and "}" are deliberately ABSENT from FROM[] — they were
       already written as correct KrutiDev in pre-patches above.
     • "ध" and "थ" remain in FROM[] for safety (bare consonant fallback)
       but their matra forms are all handled in steps 0.9/0.10.
     • Half ब् = "C"  (capital C),  half व् = "O"  (capital O).      */
  const FROM = [
    // Curly quotes → KrutiDev equivalents
    "\u2018", "\u2019", "\u201C", "\u201D",
    // Brackets / punctuation
    "(", ")",  "=", "।", "?", "-", "µ", "॰", ",", ".", "् ",
    // Devanagari digits
    "०","१","२","३","४","५","६","७","८","९",  "x",
    // Conjuncts  (longest first)
    "द्ध", "ट्ट", "ट्ठ", "ड्ढ",
    "क्र", "प्र", "द्र", "म्र", "ग्र", "ब्र", "स्र",
    "त्र", "क्ष", "ज्ञ", "श्र", "त्त", "क्त",
    "ह्न", "हृ",  "ह्म", "द्य", "ट्र", "ड्र",
    // Half consonants
    "क्", "ख्", "ग्", "घ्", "ङ्",
    "च्", "छ्", "ज्", "झ्", "ञ्",
    "ट्", "ठ्", "ड्", "ढ्", "ण्",
    "त्",        "द्", "ध्", "न्",
    "प्", "फ्", "ब्", "भ्", "म्",
    "य्", "र्", "ल्", "व्", "श्", "ष्", "स्", "ह्",
    // Matras
    "ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ",
    "ं", "ँ", "ः", "ॅ", "ऽ", "़",
    // Independent vowels
    "अ","आ","इ","ई","उ","ऊ","ऋ","ए","ऐ","ओ","औ","अं","अः",
    // Consonants
    "क","ख","ग","घ","ङ","च","छ","ज","झ","ञ",
    "ट","ठ","ड","ढ","ण","त","थ","द","ध","न",
    "प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह",
    "्", "ळ",
  ];

  const TO = [
    "^", "*", "Þ", "ß",
    "¼", "½", "¾", "A", "\\", "&", "&", "A", "]", "A", "~ ",
    "0","1","2","3","4","5","6","7","8","9",  "N",
    ")", "ê", "ë", "ï",
    "Ø","iz","nz","ez","xz","cz","lz",
    "=","{k","K","Jh","Ù","Dr",
    "à","º","ã","|","Vª","Mª",
    // Half consonants
    "D","[","X","¿","?",
    "P","N","T",">","¥",
    "V","B","M","<",".k",
    "R",      "n","/","U",    // ← त् = R, द् = n, ध् = /, न् = U
    "i","Q","C","H","e",      // ← ब् = C  (capital C)
    "¸","j","y","O","'","\"","L","g",   // ← व् = O  (capital O)
    // Matras
    "k","f","h","q","w","`","s","S","ks","kS",
    "a","¡","%","W","·","¸",
    // Vowels
    "v","vk","b","bZ","m","Å","_",",","S","vks","vkS","va","v%",
    // Consonants
    "d","[k","x","?k","?","p","N","t",">","¥",
    "V","B","M","<",".k","r","Fk","n","/k","u",  // ← ध = /k (full)
    "i","Q","c","Hk","e",";","j","y","o","'k","\"k","l","g",
    "~","G",
  ];

  for (let i = 0; i < FROM.length; i++) {
    if (text.includes(FROM[i])) {
      text = text.split(FROM[i]).join(TO[i]);
    }
  }
  return text;
}

export const mangalToKrutidev = unicodeToKrutidev;

/* ──────────────────────────────────────────────────────────────── */
/* 2.  Unicode  →  Shivaji                                         */
/* ──────────────────────────────────────────────────────────────── */
export function unicodeToShivaji(sourceText) {
  if (!sourceText) return "";
  let text = preProcess(sourceText);

  /* STEP 0 */
  text = text.replace(/द्\s*्\s*ध/g, "द्ध");
  text = text.replace(/त्\s*्\s*त/g, "त्त");
  text = text.replace(/द\s*्\s*द/g,  "द्द");
  text = text.replace(/द\s*्\s*य/g,  "द्य");
  text = text.replace(/ह\s*्\s*म/g,  "ह्म");

  /* STEP 0.5 */
  text = text.replace(/ल्ल/g,  "Yy");
  text = text.replace(/श्व/g,  "Üo");
  text = text.replace(/र्थ/g,  "FkZ");
  text = text.replace(/दृ/g,   "—");
  text = text.replace(/कृ/g,   "—");
  text = text.replace(/क्ष्/g, "{");

  /* Same ध / थ / रू patches — Shivaji shares these codepoints */
  text = text.replace(/धो/g,"/ks"); text = text.replace(/धौ/g,"/kS");
  text = text.replace(/धा/g,"/kk"); text = text.replace(/धि/g,"f/k");
  text = text.replace(/धी/g,"/kh"); text = text.replace(/धु/g,"/kq");
  text = text.replace(/धू/g,"/kw"); text = text.replace(/धे/g,"/ks");
  text = text.replace(/धं/g,"/ka"); text = text.replace(/ध्/g,"/");
  text = text.replace(/ध(?=[^ािीुूृेैोौंःँॅ]|$)/g, "/k");

  text = text.replace(/था/g,"Fkk");  text = text.replace(/थि/g,"fFk");
  text = text.replace(/थी/g,"Fkh");  text = text.replace(/थ्/g,"F");
  text = text.replace(/थ(?=[^ािीुूृेैोौंःँॅ]|$)/g, "Fk");

  text = text.replace(/रू/g, ":");
  text = text.replace(/त्ति/g, "Rfr");
  text = text.replace(/ड्([क-ह])/g, "M~$1");

  /* STEP 1 : Reph */
  text = text.replace(/र्([क-ह])/g, "$1Z");
  const matras = "ािीुूृेैोौं:ँॅ";
  const zR     = new RegExp(`Z([${matras}])`, "g");
  text = text.replace(zR,"$1Z"); text = text.replace(zR,"$1Z");
  text = text.replace(/Za/g,"aZ");

  /* STEP 2 : Chhoti i */
  let pos = text.indexOf("ि");
  while (pos !== -1) {
    const left = text.charAt(pos-1), lp = text.charAt(pos-2);
    if (lp === "्") {
      const base = text.charAt(pos-3);
      text = text.replace(base+"्"+left+"ि", "f"+base+"्"+left);
    } else {
      text = text.replace(left+"ि", "f"+left);
    }
    pos = text.search(/ि/, pos+1);
  }

  /* STEP 3 : Shivaji map
     Key differences from KrutiDev:
       ण् = "."  (not ".k")
       त् = "R",  थ् = "F",  ध् = "/"
       प् = "I",  ब् = "C",  म् = "E"
       ल् = "Y",  व् = "O"
       द्ध = "ð", द्व = "n~o"                                      */
  const FROM = [
    "\u2018","\u2019","\u201C","\u201D",
    "(",")", "=","।","?","-","µ","॰",",",".","् ",
    "०","१","२","३","४","५","६","७","८","९", "x",
    "द्ध","ट्ट","ट्ठ","ड्ढ",
    "क्र","प्र","द्र","म्र","ग्र","ब्र","स्र",
    "त्र","क्ष","ज्ञ","श्र","त्त","क्त",
    "ह्न","हृ","ह्म","द्य","ट्र","ड्र","श्व","द्व",
    "क्","ख्","ग्","घ्","ङ्",
    "च्","छ्","ज्","झ्","ञ्",
    "ट्","ठ्","ड्","ढ्","ण्",
    "त्",      "द्","ध्","न्",
    "प्","फ्","ब्","भ्","म्",
    "य्","र्","ल्","व्","श्","ष्","स्","ह्",
    "ळ","ॐ","ऱ",
    "ा","ि","ी","ु","ू","ृ","े","ै","ो","ौ",
    "ं","ँ","ः","ॅ","ऽ","़",
    "अ","आ","इ","ई","उ","ऊ","ऋ","ए","ऐ","ओ","औ","अं","अः",
    "क","ख","ग","घ","ङ","च","छ","ज","झ","ञ",
    "ट","ठ","ड","ढ","ण","त","थ","द","ध","न",
    "प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह",
    "्",
  ];
  const TO = [
    "^","*","Þ","ß",
    "¼","½","¾","A","\\","&","&","A","]","-","~ ",
    "0","1","2","3","4","5","6","7","8","9", "N",
    "ð","ê","ë","ï",
    "Ø","iz","nz","ez","xz","cz","lz",
    "=","{k","K","Jh","Ù","Dr",
    "à","º","ã","|","Vª","Mª","Üo","n~o",
    "D","[","X","¿","?",
    "P","N","T",">","¥",
    "V","B","M","<",".",          // ← ण् = "."  (Shivaji)
    "R",      "n","/","U",        // ← त्=R, द्=n, ध्=/, न्=U
    "I","Q","C","H","E",          // ← प्=I, ब्=C, म्=E  (Shivaji)
    "¸","j","Y","O","'","\"","L","g",   // ← ल्=Y, व्=O  (Shivaji)
    "Ø","†","J",
    "k","f","h","q","w","`","s","S","ks","kS",
    "a","¡","%","W","·","¸",
    "v","vk","b","bZ","m","Å","_",",","S","vks","vkS","va","v%",
    "d","[k","x","?k","?","p","N","t",">","¥",
    "V","B","M","<",".k","r","Fk","n","/k","u",
    "i","Q","c","Hk","e",";","j","y","o","'k","\"k","l","g",
    "~",
  ];

  for (let i = 0; i < FROM.length; i++) {
    if (text.includes(FROM[i])) {
      text = text.split(FROM[i]).join(TO[i]);
    }
  }
  return text;
}

/* ──────────────────────────────────────────────────────────────── */
/* 3.  KrutiDev  →  Unicode                                        */
/* ──────────────────────────────────────────────────────────────── */
export function krutidevToUnicode(text) {
  return text ? kru2uni(text) : "";
}

/* ──────────────────────────────────────────────────────────────── */
/* 4.  Shivaji  →  Unicode                                         */
/* ──────────────────────────────────────────────────────────────── */
export function shivajiToUnicode(text) {
  if (!text) return "";
  // Patch Shivaji-only codes → KrutiDev equivalents, then use kru2uni
  let t = text;
  t = t.replace(/ð/g,   ")");   // द्ध
  t = t.replace(/n~o/g, "}");   // द्व
  t = t.replace(/†/g,   "ॐ");
  t = t.replace(/J/g,   "ऱ");
  t = t.replace(/I/g,   "i");   // half प
  t = t.replace(/C/g,   "c");   // half ब
  t = t.replace(/E/g,   "e");   // half म
  t = t.replace(/Y/g,   "y");   // half ल
  t = t.replace(/O/g,   "o");   // half व
  return kru2uni(t);
}

/* ──────────────────────────────────────────────────────────────── */
/* 5.  Unicode  →  Preeti                                          */
/* ──────────────────────────────────────────────────────────────── */
export function unicodeToPreeti(sourceText) {
  if (!sourceText) return "";
  let text = preProcess(sourceText);

  // Reph
  text = text.replace(/र्([क-ह])/g, "$1«");   // placeholder for reph
  const zR = /«([ािीुूृेैोौं])/g;
  text = text.replace(zR,"$1«"); text = text.replace(zR,"$1«");

  // Chhoti i
  let pos = text.indexOf("ि");
  while (pos !== -1) {
    const left = text.charAt(pos-1), lp = text.charAt(pos-2);
    if (lp==="्") { const b=text.charAt(pos-3); text=text.replace(b+"्"+left+"ि","f"+b+"्"+left); }
    else text=text.replace(left+"ि","f"+left);
    pos=text.search(/ि/,pos+1);
  }

  const FROM = [
    "क्ष","त्र","ज्ञ","श्र",
    "क्","ख्","ग्","घ्","च्","छ्","ज्","झ्","ट्","ठ्","ड्","ढ्",
    "ण्","त्","थ्","द्","ध्","न्","प्","फ्","ब्","भ्","म्",
    "य्","र्","ल्","व्","श्","ष्","स्","ह्",
    "ा","ि","ी","ु","ू","ृ","े","ै","ो","ौ","ं","ँ","ः",
    "अ","आ","इ","ई","उ","ऊ","ए","ऐ","ओ","औ",
    "क","ख","ग","घ","ङ","च","छ","ज","झ","ञ",
    "ट","ठ","ड","ढ","ण","त","थ","द","ध","न",
    "प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह","ळ",
    "०","१","२","३","४","५","६","७","८","९","।",
    "्","«",
  ];
  const TO = [
    "If","q","1","Zo",
    "s","v","u","3","r","5","h","em","6","7","8","9",
    "0","t","F","b","w","g","k","km","a","e","d",
    "o","/","n","j","z","if",";","x",
    "-","f","L","'","\"","`","s","P","]","O",
    "F","M",";",
    "v","g","O","{","=","+","s","P","cf]","{]",
    "c","v","u","3","~","r","5","h","em","~",
    "6","7","8","9","0","t","F","b","w","g",
    "k","km","a","e","d","o","/","n","j","z","if",";","x","Ø",
    "å","!","@","#","$","%","^","&","*","(","A",
    "\\","Z",
  ];

  for (let i=0;i<FROM.length;i++) if(text.includes(FROM[i])) text=text.split(FROM[i]).join(TO[i]);
  return text;
}

/* ──────────────────────────────────────────────────────────────── */
/* 6.  Mangal  →  Unicode  (Mangal IS Unicode — just normalise)    */
/* ──────────────────────────────────────────────────────────────── */
export function mangalToUnicode(text) {
  return text ? preProcess(text).normalize("NFC") : "";
}

/* ──────────────────────────────────────────────────────────────── */
/* DISPATCHER                                                       */
/* ──────────────────────────────────────────────────────────────── */
export const SUPPORTED_CONVERSIONS = {
  "unicode-to-krutidev": { fn: unicodeToKrutidev, label: "Unicode → KrutiDev" },
  "unicode-to-shivaji":  { fn: unicodeToShivaji,  label: "Unicode → Shivaji"  },
  "unicode-to-preeti":   { fn: unicodeToPreeti,   label: "Unicode → Preeti"   },
  "krutidev-to-unicode": { fn: krutidevToUnicode,  label: "KrutiDev → Unicode" },
  "shivaji-to-unicode":  { fn: shivajiToUnicode,   label: "Shivaji → Unicode"  },
  "mangal-to-krutidev":  { fn: mangalToKrutidev,   label: "Mangal → KrutiDev"  },
  "mangal-to-unicode":   { fn: mangalToUnicode,    label: "Mangal → Unicode"   },
};

export function convert(conversionType, text) {
  const entry = SUPPORTED_CONVERSIONS[conversionType];
  if (!entry) throw new Error(
    `Unsupported: "${conversionType}". Options: ${Object.keys(SUPPORTED_CONVERSIONS).join(", ")}`
  );
  return entry.fn(text);
}