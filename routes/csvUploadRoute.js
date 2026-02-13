import express from "express";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import CsvCaseModel from "../models/CsvCaseModel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const results = [];

    // ✅ Debugging: Check file path
    console.log("📂 Processing File:", req.file.path);

    fs.createReadStream(req.file.path)
      .pipe(csv({
        // 🔥 FIX 1: Headers ko saaf-suthra banayein (Trim + Lowercase)
        mapHeaders: ({ header }) => header.trim().toLowerCase()
      }))
      .on("data", (data) => {
        // ✅ Debugging: Pehli row print karein taaki columns dikhein
        if (results.length === 0) console.log("🔍 First Row Data:", data);

        // 🔥 FIX 2: Ab hum lowercase keys use karenge (safe side)
        // CSV Headers expected: id, lastdate, court, matterno, first party, second party, next date
        results.push({
          userId: req.body.userId, 
          serialNo: data["id"] || data["serialno"], 
          lastDate: data["lastdate"] || data["last date"],
          courtName: data["court"] || data["courtname"],
          caseNumber: data["matterno"] || data["matter no"] || data["casenumber"],
          petitioner: data["first party"] || data["petitioner"] || data["firstparty"],
          respondent: data["second party"] || data["respondent"] || data["secondparty"],
          nextDate: data["next date"] || data["nextdate"] || ""
        });
      })
      .on("end", async () => {
        try {
          if (results.length > 0) {
            console.log(`💾 Saving ${results.length} records to DB...`);
            
            // 🔥 FIX 3: Bulk Insert with Ordered: false (ek fail ho to baki rukna nahi chahiye)
            await CsvCaseModel.insertMany(results, { ordered: false });
            
            res.json({ success: true, message: `${results.length} cases imported successfully!` });
          } else {
            res.status(400).json({ error: "CSV file is empty or headers mismatch." });
          }
        } catch (error) {
          console.error("❌ Database Insert Error:", error);
          res.status(500).json({ error: "Failed to save data. Check server logs." });
        } finally {
          // File delete karein (Error ho ya Success)
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }
      });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/list/:userId", async (req, res) => {
  try {
    const cases = await CsvCaseModel.find({ userId: req.params.userId });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});

export default router;