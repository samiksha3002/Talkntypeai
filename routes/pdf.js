import express from "express";
import multer from "multer";
import { extractTextFromPDF } from "./pdfController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-pdf", upload.single("file"), extractTextFromPDF);

export default router;
