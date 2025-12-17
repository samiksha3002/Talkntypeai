import express from "express";
const router = express.Router();

// 🔠 Unicode (Mangal) → KrutiDev mapping (starter)
const unicodeToKrutiMap = {
  "क": "d",
  "ख": "[",
  "ग": "x",
  "घ": "X",
  "च": "p",
  "छ": "P",
  "ज": "h",
  "झ": "H",
  "ट": "V",
  "ठ": "B",
  "ड": "M",
  "ढ": "<",
  "त": "r",
  "थ": "F",
  "द": "n",
  "ध": "/",
  "न": "u",
  "प": "i",
  "फ": "Q",
  "ब": "c",
  "भ": "e",
  "म": "m",
  "य": ";",
  "र": "j",
  "ल": "y",
  "व": "o",
  "श": "'",
  "ष": "\"",
  "स": "l",
  "ह": "g",
  "ा": "k",
  "ि": "f",
  "ी": "h",
  "ु": "q",
  "ू": "w",
  "े": "s",
  "ै": "S",
  "ो": "ks",
  "ौ": "kS",
  "ं": "a",
  "ः": "%",
  "्": "~"
};

// 🔁 converter
function unicodeToKruti(text) {
  let out = "";
  for (let ch of text) {
    out += unicodeToKrutiMap[ch] || ch;
  }
  return out;
}

// 🚀 API route
router.post("/unicode-to-krutidev", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const convertedText = unicodeToKruti(text);
  res.json({ convertedText });
});

export default router;
