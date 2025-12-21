import express from "express";
import axios from "axios";
const router = express.Router();

// Example dictionary using a free API (Urban Dictionary or Hindi dictionary)
router.get("/define/:word", async (req, res) => {
  try {
    const { word } = req.params;

    // Replace with your dictionary API
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(404).json({ message: "Word not found" });
  }
});

export default router;
