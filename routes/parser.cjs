// routes/parser.cjs
const pdfLib = require('pdf-parse');

// --- THE FIX ---
// If 'pdfLib' is an object { default: [Function] }, we grab .default
// If 'pdfLib' is already the function, we use it directly.
const pdf = (typeof pdfLib === 'function') ? pdfLib : pdfLib.default;
// ---------------

async function parsePDF(buffer) {
    try {
        if (typeof pdf !== 'function') {
            throw new Error(`pdf-parse failed to load. Type is: ${typeof pdf}`);
        }
        
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error("Parser Error:", error);
        throw error;
    }
}

module.exports = { parsePDF };