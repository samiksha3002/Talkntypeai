export function convertToKrutiDev(text) {
    if (!text) return "";

    let modifiedText = text;

    // PRE PROCESSING — Replace some Unicode combos
    const preMap = {
        "िं": "िं",
        "ीं": "ीं",
        "ुं": "ुं",
        "ूं": "ूं",
        "ं": "ं",
        "ः": ":",
        "ँ": "Z"
    };

    for (const key in preMap) {
        modifiedText = modifiedText.replace(new RegExp(key, "g"), preMap[key]);
    }

    // MAIN UNICODE → KRUTIDEV MAPPING
    const unicodeMap = {
        "क": "d", "ख": "[", "ग": "x", "घ": "X", "ङ": "¢",
        "च": "p", "छ": "P", "ज": "h", "झ": "H", "ञ": "=",
        "ट": "V", "ठ": "B", "ड": "M", "ढ": "<", "ण": "²",
        "त": "r", "थ": "F", "द": "n", "ध": "N", "न": "u",
        "प": "i", "फ": "I", "ब": "c", "भ": "C", "म": "e",
        "य": ";", "र": "/", "ल": "y", "व": "o",
        "श": "'", "ष": "S", "स": "l", "ह": "g",

        // MATRAS
        "ा": "k", "ि": "f", "ी": "q", "ु": "w", "ू": "W",
        "े": "s", "ै": "S", "ो": "ks", "ौ": "ks",
        "ृ": "Z",

        // SPECIAL
        "ं": "a", "ः": ":", "ँ": "Z",
        "।": ".", "॥": "..",

        // NUMBERS
        "०": "0", "१": "1", "२": "2", "३": "3",
        "४": "4", "५": "5", "६": "6", "७": "7",
        "८": "8", "९": "9"
    };

    // APPLY MAIN MAP
    for (const key in unicodeMap) {
        modifiedText = modifiedText.replace(new RegExp(key, "g"), unicodeMap[key]);
    }

    // HANDLE HALF LETTERS (Halant / Virama)
    modifiedText = modifiedText.replace(/्([क-ह])/g, function (match, letter) {
        const map = {
            "क": "d", "ख": "[", "ग": "x", "घ": "X",
            "च": "p", "छ": "P", "ज": "h", "झ": "H",
            "ट": "V", "ठ": "B", "ड": "M",
            "त": "r", "थ": "F", "द": "n", "ध": "N",
            "प": "i", "फ": "I", "ब": "c", "भ": "C",
            "म": "e", "न": "u", "ल": "y", "व": "o",
            "स": "l", "ह": "g"
        };

        return map[letter] ? map[letter] + "³" : "";
    });

    // HANDLE REPH (र्)
    modifiedText = modifiedText.replace(/र्/g, "Z");

    // REPOSITION 'ि' BEFORE CONSONANT
    modifiedText = modifiedText.replace(/([क-ह]़?)(ि)/g, "f$1");

    return modifiedText;
}
