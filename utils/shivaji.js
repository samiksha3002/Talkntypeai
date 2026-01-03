export function convertToShivaji(text = "") {
  let output = text;

  const map = {
    "क": "D",
    "ख": "K",
    "ग": "G",
    "घ": "घ",
    "च": "C",
    "छ": "छ",
    "ज": "J",
    "झ": "झ",
    "ट": "ट",
    "ठ": "ठ",
    "ड": "ड",
    "ढ": "ढ",
    "ण": "ण",
    "त": "T",
    "थ": "थ",
    "द": "द",
    "ध": "ध",
    "न": "न",
    "प": "P",
    "फ": "फ",
    "ब": "ब",
    "भ": "भ",
    "म": "M",
    "य": "Y",
    "र": "R",
    "ल": "L",
    "व": "V",
    "श": "श",
    "स": "S",
    "ह": "H"
  };

  Object.keys(map).forEach((key) => {
    output = output.split(key).join(map[key]);
  });

  return output;
}
