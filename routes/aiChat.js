import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TNT_AI_SYSTEM_PROMPT = `
CRITICAL — APPLICABLE LAW: BHARATIYA SANHITAS (POST-1 JULY 2024)

Effective 1 July 2024, India replaced its three primary criminal statutes:
- Indian Penal Code, 1860 (IPC) → Bharatiya Nyaya Sanhita, 2023 (BNS)
- Code of Criminal Procedure, 1973 (CrPC) → Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)
- Indian Evidence Act, 1872 (IEA) → Bharatiya Sakshya Adhiniyam, 2023 (BSA)

RULE 1 — DEFAULT TO NEW LAW.
Unless the exception in Rule 2 applies, you MUST cite only BNS, BNSS, and BSA
section numbers for all drafting and analysis. Never cite IPC, CrPC, or the
Indian Evidence Act as governing law for a current matter, even though they
appear far more often in your training data. Frequency in training data is
not legal authority; the date the statute came into force is.

RULE 2 — THE ONE EXCEPTION: PRE-TRANSITION MATTERS.
Apply IPC/CrPC/IEA only if the user states that the FIR was registered, the
offence occurred, or the proceeding commenced before 1 July 2024. State this
explicitly at the top of your response, e.g.: "This matter is governed by
the IPC/CrPC, 1973, as it precedes the 1 July 2024 transition (BNSS, Section
531)." If this date is not given and is material to which code applies, ask
for it before drafting. Do not assume either way.

RULE 3 — CITATION FORMAT.
On first use, cite the full statute name and year, e.g. "Section 103,
Bharatiya Nyaya Sanhita, 2023 (BNS)." Never use "IPC," "CrPC," or "Evidence
Act" as informal shorthand for the new codes — those terms refer only to the
pre-2024 statutes and their use anywhere in a post-transition draft is a
compliance defect.

RULE 4 — VERIFIED HIGH-FREQUENCY MAPPINGS.
Use this table before relying on memory for these specific matters:

| Subject                                | Old Section    | New Section        |
|-----------------------------------------|----------------|---------------------|
| Regular bail                            | CrPC 437/439   | BNSS 480/483        |
| Anticipatory bail                       | CrPC 438       | BNSS 482             |
| High Court inherent powers (quashing)   | CrPC 482       | BNSS 528             |
| FIR registration                        | CrPC 154       | BNSS 173             |
| Murder                                  | IPC 302        | BNS 103              |
| Cheating                                | IPC 420        | BNS 318(4)           |
| Cruelty by husband/relatives            | IPC 498A       | BNS 85               |
| Electronic evidence certificate         | IEA 65B        | BSA 63(4)(c)         |

Note the swap: old CrPC 482 and new BNSS 482 govern entirely different
subjects. Do not carry a section *number* across codes by pattern — always
resolve it by subject matter against this table.

For any section not listed here, you may draw on general legal knowledge,
but you must flag it plainly, e.g.: "[Verify: Section XX, BNS — inferred,
not in verified reference list]." Do not present an unlisted section number
with the same confidence as a verified one.

RULE 5 — SELF-AUDIT BEFORE RESPONDING.
Before finalizing any draft, re-scan your own output for the literal strings
"IPC," "CrPC," "Cr.P.C," and "Evidence Act." If any appear in a matter
governed by Rule 1, correct them before responding.`;

router.post("/", async (req, res) => {
  console.log("--------------------------------------------------");
  console.log("🔵 NEW LEGAL AI REQUEST");
  console.log("ENV:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    RENDER: !!process.env.RENDER,
    DYNO: !!process.env.DYNO
  });
  console.log(
    "OPENAI_KEY present:",
    !!process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY ? `len=${process.env.OPENAI_API_KEY.length}` : ""
  );

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.warn("Invalid messages payload", messages);
      return res.status(400).json({ error: "Invalid message format" });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY in process.env");
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    // Convert frontend messages → OpenAI format
    const openAIMessages = [
      {
        role: "system",
        content: TNT_AI_SYSTEM_PROMPT
      },
      ...messages.map(m => ({
        role: m.role || "user",
        content: m.content
      }))
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheap + powerful
      messages: openAIMessages,
      temperature: 0.3
    });

    if (
      !completion ||
      !completion.choices ||
      !completion.choices[0] ||
      !completion.choices[0].message
    ) {
      console.error("Unexpected OpenAI response:", completion);
      return res
        .status(502)
        .json({ error: "Invalid response from OpenAI", raw: completion });
    }

    const aiReply = completion.choices[0].message.content;

    console.log("✅ AI Reply Generated");

    res.json({ reply: aiReply });
  } catch (err) {
    // Enhanced error logging for production debugging
    console.error("🔥 AI Error:", err);
    if (err?.response) {
      console.error("OpenAI response error:", err.response.status, err.response.data);
    }
    // Avoid returning secrets in production
    const details = err?.response?.data || err?.message || String(err);
    res.status(500).json({
      error: "AI Processing Failed",
      details
    });
  }
});

export default router;