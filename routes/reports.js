// routes/reports.js
import express from "express";
import PDFDocument from "pdfkit";
import Case from "../models/case.js"; // adjust path

const router = express.Router();

router.get("/", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const cases = await Case.find({
      hearingDate: { $gte: start, $lte: end },
      userId: req.user?.id, // requires auth middleware
    });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=CaseReport_${startDate}_to_${endDate}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(18).text("Case Report", { align: "center" });
    doc.moveDown();

    if (cases.length === 0) {
      doc.fontSize(12).text("No cases found for this period.");
    } else {
      cases.forEach((c) => {
        doc.fontSize(12).text(`Case: ${c.caseNumber} | Client: ${c.clientName}`);
        doc.text(`Hearing Date: ${new Date(c.hearingDate).toISOString().split("T")[0]}`);
        doc.moveDown();
      });
    }

    doc.end();
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// ✅ ES Module default export
export default router;
