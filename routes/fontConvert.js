import express from "express";
import { convertToKrutiDev } from "../utils/fontConverter.js";

const router = express.Router();

router.post("/convert", (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    const converted = convertToKrutiDev(text);
    res.json({ converted });
});

export default router;
