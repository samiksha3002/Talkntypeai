/**
 * fontConverter.route.js
 * ─────────────────────────────────────────────────────────────────
 * Express router handling all font-conversion API endpoints.
 *
 * Mount in your app:
 *   import fontConverterRouter from "./fontConverter.route.js";
 *   app.use("/api/font", fontConverterRouter);
 *
 * Endpoints:
 *   POST /api/font/convert              — universal endpoint (recommended)
 *   POST /api/font/krutidev-to-unicode  — legacy compat
 *   POST /api/font/unicode-to-krutidev
 *   POST /api/font/shivaji-to-unicode
 *   POST /api/font/preeti-to-unicode
 *   POST /api/font/mangal-to-krutidev
 *   POST /api/font/mangal-to-unicode
 *   GET  /api/font/supported            — list supported conversions
 * ─────────────────────────────────────────────────────────────────
 */

import express from "express";
import { convert, SUPPORTED_CONVERSIONS } from "./fontConverterUtils.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Shared validation + conversion helper                               */
/* ------------------------------------------------------------------ */

function runConversion(conversionType, req, res) {
  const { text } = req.body;

  // Validate input
  if (text === undefined || text === null) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: text",
    });
  }

  if (typeof text !== "string") {
    return res.status(400).json({
      success: false,
      error: "Field 'text' must be a string",
    });
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Field 'text' must not be empty",
    });
  }

  if (trimmed.length > 100_000) {
    return res.status(413).json({
      success: false,
      error: "Text exceeds the 100,000 character limit",
    });
  }

  try {
    const convertedText = convert(conversionType, text);
    return res.status(200).json({
      success: true,
      conversionType,
      originalText: text,
      convertedText,
    });
  } catch (err) {
    console.error(`[FontConverter] Error during "${conversionType}":`, err);
    return res.status(500).json({
      success: false,
      error: "Conversion failed. Please check your input text.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/font/supported                                              */
/* ------------------------------------------------------------------ */

router.get("/supported", (_req, res) => {
  const supported = Object.entries(SUPPORTED_CONVERSIONS).map(([key, val]) => ({
    id: key,
    label: val.label,
  }));
  res.status(200).json({ success: true, supported });
});

/* ------------------------------------------------------------------ */
/* POST /api/font/convert  (universal — recommended)                   */
/* Body: { text: string, conversionType: string }                      */
/* ------------------------------------------------------------------ */

router.post("/convert", (req, res) => {
  const { conversionType } = req.body;

  if (!conversionType) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: conversionType",
    });
  }

  if (!SUPPORTED_CONVERSIONS[conversionType]) {
    return res.status(400).json({
      success: false,
      error: `Unsupported conversionType: "${conversionType}". Call GET /api/font/supported for the full list.`,
      supported: Object.keys(SUPPORTED_CONVERSIONS),
    });
  }

  return runConversion(conversionType, req, res);
});

/* ------------------------------------------------------------------ */
/* Named endpoints (one per conversion) for legacy compatibility       */
/* ------------------------------------------------------------------ */

router.post("/krutidev-to-unicode", (req, res) =>
  runConversion("krutidev-to-unicode", req, res)
);

router.post("/unicode-to-krutidev", (req, res) =>
  runConversion("unicode-to-krutidev", req, res)
);

router.post("/shivaji-to-unicode", (req, res) =>
  runConversion("shivaji-to-unicode", req, res)
);

router.post("/preeti-to-unicode", (req, res) =>
  runConversion("preeti-to-unicode", req, res)
);

router.post("/mangal-to-krutidev", (req, res) =>
  runConversion("mangal-to-krutidev", req, res)
);

router.post("/mangal-to-unicode", (req, res) =>
  runConversion("mangal-to-unicode", req, res)
);

export default router;