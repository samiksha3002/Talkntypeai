export function convertToKrutiDev(text = "") {
  let output = text;

  const map = {
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
    "ण": ".",
    "त": "r",
    "थ": "F",
    "द": "n",
    "ध": "/",
    "न": "u",
    "प": "i",
    "फ": "Q",
    "ब": "c",
    "भ": "j",
    "म": "e",
    "य": ";",
    "र": "j",
    "ल": "y",
    "व": "o",
    "श": "Z",
    "ष": "Z",
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
    "्": "~"
    // add more mappings as needed
  };

  Object.keys(map).forEach((key) => {
    output = output.split(key).join(map[key]);
  });

  return output;
}
