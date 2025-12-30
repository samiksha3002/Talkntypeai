import express from "express";
import PDFDocument from "pdfkit";
import Case from "../models/case.js"; 

const router = express.Router();

// Note: Agar aapne auth middleware nahi banaya hai, toh hum query se userId lenge
router.get("/", async (req, res) => {
  // 1. Query se userId bhi nikalen (Frontend se bhejna padega)
  const { startDate, endDate, userId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 2. endDate ko din ke aakhir tak set karein (taaki us din ke cases miss na ho)
    end.setHours(23, 59, 59, 999);

    // 3. userId filter apply karein
    // Agar auth middleware hai toh req.user.id use karein, nahi toh query wala userId
    const finalUserId = req.user?.id || userId;

    if (!finalUserId) {
       return res.status(400).json({ error: "User ID is required to fetch cases" });
    }

    const cases = await Case.find({
      userId: finalUserId,
      hearingDate: { $gte: start, $lte: end },
    }).sort({ hearingDate: 1 }); // Date wise sort karein

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=CaseReport_${startDate}_to_${endDate}.pdf`
    );

    doc.pipe(res);
    
    // PDF Styling
    doc.fontSize(20).fillColor('#1e293b').text("Case Hearing Report", { align: "center" });
    doc.fontSize(10).fillColor('#64748b').text(`Period: ${startDate} to ${endDate}`, { align: "center" });
    doc.moveDown(2);

    if (cases.length === 0) {
      doc.fontSize(14).fillColor('red').text("No cases found for this selected period.", { align: "center" });
    } else {
      cases.forEach((c, index) => {
        doc.fontSize(12).fillColor('#000').text(`${index + 1}. Case Number: ${c.caseNumber || 'N/A'}`);
        doc.fontSize(10).fillColor('#334155').text(`   Client: ${c.clientName || 'N/A'}`);
        doc.text(`   Hearing Date: ${new Date(c.hearingDate).toDateString()}`);
        doc.text(`   Court: ${c.courtName || 'N/A'}`);
        doc.moveDown(0.5);
        doc.rect(doc.x, doc.y, 450, 0.5).stroke('#cbd5e1'); // Separator line
        doc.moveDown(1);
      });
    }

    doc.end();
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).send("Server Error");
  }
});

export default router;