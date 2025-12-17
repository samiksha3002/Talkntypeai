export function convertToPreeti(text = "") {
  let output = text;

  const map = {
    "क": "s",
    "ख": "v",
    "ग": "u",
    "घ": "3",
    "च": "r",
    "छ": "5",
    "ज": "h",
    "झ": "H",
    "ट": "6",
    "ठ": "7",
    "ड": "8",
    "ढ": "9",
    "ण": "0",
    "त": "t",
    "थ": "y",
    "द": "b",
    "ध": "w",
    "न": "g",
    "प": "k",
    "फ": "a",
    "ब": "b",
    "भ": "e",
    "म": "d",
    "य": "o",
    "र": "/",
    "ल": "n",
    "व": "j",
    "स": ";",
    "ह": "x"
  };

  Object.keys(map).forEach((key) => {
    output = output.split(key).join(map[key]);
  });

  return output;
}
