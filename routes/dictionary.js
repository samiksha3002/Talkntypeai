import express from "express";
import axios from "axios";

const router = express.Router();

// Example legal dictionary (you can expand)
const legalTerms = {
  "Vakalatnama": "A legal document authorizing an advocate to represent a client in court.",
  "Bail": "The temporary release of an accused person awaiting trial, sometimes on condition of a sum of money.",
  "Affidavit": "A written statement confirmed by oath for use as evidence in court."
};

// Route: GET /api/dictionary/define/:word
router.get("/define/:word", async (req, res) => {
  const { word } = req.params;

  // First, check if the word exists in our legalTerms object
  if (legalTerms[word]) {
    return res.json([{ 
      word, 
      meanings: [{ definitions: [{ definition: legalTerms[word] }] }] 
    }]);
  }

  // If not found in legal terms, fallback to public dictionary API
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    res.json(response.data);
  } catch (err) {
    // If API returns 404, still respond gracefully
    res.json([{ 
      word, 
      meanings: [{ definitions: [{ definition: "No definition found." }] }] 
    }]);
  }
});

export default router;
