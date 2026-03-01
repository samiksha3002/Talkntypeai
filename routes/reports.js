import express from "express";
import PDFDocument from "pdfkit";
import Case from "../models/case.js"; 

const router = express.Router();

router.get("/", async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  const finalUserId = req.user?.id || userId;
  if (!finalUserId) {
    return res.status(400).json({ error: "User ID is required to fetch cases" });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const cases = await Case.find({
      userId: finalUserId,
      hearingDate: { $gte: start, $lte: end },
    }).sort({ hearingDate: 1 }).lean();

    const doc = new PDFDocument({ margin: 50 });

    doc.on("error", (err) => {
      console.error("PDFKit Error:", err);
      if (!res.headersSent) {
        res.status(500).send("Error generating PDF");
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=CaseReport_${startDate}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).fillColor("#1e293b").text("Case Hearing Report", { align: "center" });
    doc.fontSize(10).fillColor("#64748b").text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.text(`Period: ${startDate} to ${endDate}`, { align: "center" });
    doc.moveDown(2);

    if (cases.length === 0) {
      doc.fontSize(14).fillColor("#ef4444").text("No cases found for the selected period.", { align: "center" });
    } else {
      cases.forEach((c, index) => {
        if (doc.y > 650) doc.addPage();

        doc.fontSize(12).fillColor("#0f172a").text(`${index + 1}. Case Number: ${c.caseNumber || "N/A"}`, { underline: true });
        doc.fontSize(10).fillColor("#334155").text(`   Client: ${c.clientName || "N/A"}`);
        doc.text(`   Hearing Date: ${new Date(c.hearingDate).toDateString()}`);
        doc.text(`   Court: ${c.courtName || "N/A"}`);

        doc.moveDown(0.5);
        doc.strokeColor("#cbd5e1").lineWidth(0.5)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
        doc.moveDown(1);
      });
    }

    doc.end();
  } catch (err) {
    console.error("Critical Report Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

export default router;
