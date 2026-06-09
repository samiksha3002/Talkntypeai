/**
 * fontConverterUtils.js
 * Optimized conversion logic from Devanagari (Unicode/Mangal) to legacy Kruti Dev.
 */
// -----------------------------------------------------------
// Mapping Arrays
// -----------------------------------------------------------
const array_one = [
    // A. Ligatures
    "‘", "’", "“", "”", "(", ")", "{", "}", "=", "।", "?", "-", "µ", "॰", ",", ".", "् ",
    "०", "१", "२", "३", "४", "५", "६", "७", "८", "९", "x", 
    "द्ध", "ट्ट", "ट्ठ", "ड्ढ", 
    "क्र", "प्र", "द्र", "म्र", "ग्र", "ब्र", "स्र", 
    "त्र", "क्ष", "ज्ञ", "श्र", "त्त", "क्त", 
    "ह्न", "ह्य", "हृ", "ह्म", "द्य", "द्व",
    "ट्र", "ड्र", "श्व", 
    
    // B. Half Characters
    "क्", "ख्", "ग्", "घ्", "ङ्", 
    "च्", "छ्", "ज्", "झ्", "ञ्", 
    "ट्", "ठ्", "ड्", "ढ्", "ण्", 
    "त्", "थ्", "द्", "ध्", "न्", 
    "प्", "फ्", "ब्", "भ्", "म्", 
    "य्", "र्", "ल्", "व्", "श्", "ष्", "स्", "ह्",
    // C. Matras
    "ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ँ", "ः", "ॅ", "ऽ", "़", 
    // D. Consonants
    "अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः", 
    "क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ", 
    "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न", 
    "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह",
    "्", "ळ"
];
const array_two = [
    // A. Ligatures Mappings
    "^", "*", "Þ", "ß", "¼", "½", "¿", "À", "¾", "A", "\\", "&", "&", "A", "]", "A", "~ ", 
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "N", 
    ")", "ê", "ë", "ï", 
    "Ø", "iz", "nz", "Ez", "xz", "Cz", "Lz", 
    "=", "{k", "K", "Jh", "Ù", "Dr", 
    "à", "á", "º", "ã", "|", "}", 
    "Vª", "Mª", "Üo", 
    // B. Half Characters Mappings
    "D", "[", "X", "?", "?", 
    "P", "N", "T", ">", "¥", 
    "V", "B", "M", "<", ".", 
    "R", "F", "n", "/", "U", 
    "i", "Q", "C", "H", "E", 
    "¸", "j", "Y", "O", "'", "\"", "L", "g", 
    // C. Matras
    "k", "f", "h", "q", "w", "`", "s", "S", "ks", "kS", "a", "¡", "%", "W", "·", "¸", 
    // D. Consonants
    "v", "vk", "b", "bZ", "m", "Å", "_", ",","S", "vks", "vkS", "va", "v%", 
    "d", "[k", "x", "?k", "?", "p", "N", "t", ">", "¥", 
    "V", "B", "M", "<", ".k", "r", "Fk", "n", "/k", "u", 
    "ik", "Q", "c", "Hk", "e", ";", "j", "y", "o", "'k", "\"k", "l", "g",
    "~", "G"
];
// -----------------------------------------------------------
// Helper: Shift Reph (र्) past consonant clusters
// -----------------------------------------------------------
function shiftReph(text) {
    let pos = text.indexOf("र्");
    while (pos !== -1) {
        let idx = pos + 2; // position after 'र्'
        
        if (idx < text.length) {
            idx++; // Move past first consonant of the cluster
            if (idx < text.length && text.charAt(idx) === "़") {
                idx++; // Skip nukta
            }
            
            // Skip any remaining half consonants in the cluster
            while (idx < text.length && text.charAt(idx) === "्") {
                idx++; // skip halant
                if (idx < text.length && text.charAt(idx) === "़") {
                    idx++; // skip nukta
                }
                if (idx < text.length) {
                    idx++; // skip base consonant
                }
            }
            
            // Skip trailing matras
            const matras = "ािीुूृेैोौंँःॅ";
            while (idx < text.length && matras.includes(text.charAt(idx))) {
                idx++;
            }
            
            let cluster = text.slice(pos + 2, idx);
            text = text.slice(0, pos) + cluster + "Z" + text.slice(idx);
        }
        pos = text.indexOf("र्", pos + 1);
    }
    return text;
}
// -----------------------------------------------------------
// Helper: Shift Chhoti 'i' (ि) to start of consonant cluster
// -----------------------------------------------------------
function shiftChhotiI(text) {
    let pos = text.indexOf("ि");
    while (pos !== -1) {
        let idx = pos - 1;
        
        if (idx >= 0) {
            if (text.charAt(idx) === "़") {
                idx--;
            }
            idx--; // skip main base consonant
            
            // scan backward past half consonants
            while (idx >= 0 && text.charAt(idx) === "्") {
                idx--; // skip halant
                if (idx >= 0 && text.charAt(idx) === "़") {
                    idx--; // skip nukta
                }
                idx--; // skip base consonant
            }
            
            let clusterStart = idx + 1;
            let cluster = text.slice(clusterStart, pos);
            text = text.slice(0, clusterStart) + "ि" + cluster + text.slice(pos + 1);
        }
        pos = text.indexOf("ि", pos + 1);
    }
    return text;
}
// -----------------------------------------------------------
// Main Conversion Function
// -----------------------------------------------------------
export const convertToKrutiDev = (sourceText) => {
    if (!sourceText) return "";
    let text = sourceText;
    // STEP 0.1: Standardize Spaces
    text = text.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");
    // STEP 0.2: Normalize Pre-composed Nukta Characters
    text = text.replace(/\u0958/g, "क़")
               .replace(/\u0959/g, "ख़")
               .replace(/\u095a/g, "ग़")
               .replace(/\u095b/g, "ज़")
               .replace(/\u095c/g, "ड़")
               .replace(/\u095d/g, "ढ़")
               .replace(/\u095e/g, "फ़")
               .replace(/\u095f/g, "य़");
    // STEP 0.3: Joint Unicode Conjuncts Pre-joining (Single Halant Fix)
    text = text.replace(/द\s*्\s*ध/g, "द्ध"); 
    text = text.replace(/त\s*्\s*त/g, "त्त"); 
    text = text.replace(/द\s*्\s*द/g, "द्द");
    text = text.replace(/ट\s*्\s*ट/g, "ट्ट");
    text = text.replace(/ड\s*्\s*ड/g, "ड्ड");
    text = text.replace(/ड\s*्\s*ढ/g, "ड्ढ");
    text = text.replace(/द\s*्\s*य/g, "द्य"); 
    text = text.replace(/ह\s*्\s*म/g, "ह्म"); 
    text = text.replace(/ल\s*्\s*ल/g, "ल्ल");
    text = text.replace(/द\s*्\s*व/g, "द्व");
    text = text.replace(/ह\s*्\s*य/g, "ह्य");
    text = text.replace(/ह\s*्\s*र/g, "ह्र");
    text = text.replace(/ह\s*्\s*न/g, "ह्न");
    text = text.replace(/ह\s*्\s*ल/g, "ह्ल");
    text = text.replace(/क\s*्\s*त/g, "क्त");
    text = text.replace(/श\s*्\s*व/g, "श्व");
    // Specially adjust 'ख + ़' so that dot is drawn under base instead of vertical stem
    text = text.replace(/ख\s*़/g, "ख़्ा");
    // STEP 1: Shift Reph (र्)
    text = shiftReph(text);
    // STEP 2: Shift Chhoti 'i' (ि)
    text = shiftChhotiI(text);
    // STEP 3: Mapping Execution
    for (let i = 0; i < array_one.length; i++) {
        if (text.includes(array_one[i])) {
            text = text.split(array_one[i]).join(array_two[i]);
        }
    }
    return text;
};
