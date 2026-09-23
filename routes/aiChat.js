// routes/aiChat.js
// ─────────────────────────────────────────────────────────────────────────────
// TALKNTYPE — MAIN LEGAL AI CHAT ROUTE
//
// Public endpoint:
// POST /api/chat
//
// Flow:
//
// Frontend
//    ↓
// /api/chat
//    ↓
// this route
//    ↓
// aiOrchestrator.js
//    ↓
// legalContext.js
//    ↓
// legalKnowledge.js
//    ↓
// AI reasoning
//    ↓
// response
//
// IMPORTANT:
// This file should NOT contain the entire legal brain.
// The actual reasoning belongs in aiOrchestrator.js.
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";

import {
  runLegalAI,
} from "../services/aiOrchestrator.js";


const router = express.Router();


// ═════════════════════════════════════════════════════════════════════════════
// HELPER — REQUEST ID
// ═════════════════════════════════════════════════════════════════════════════

function createRequestId() {
  return (
    "tnt_" +
    Date.now().toString(36) +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// POST /
// ═════════════════════════════════════════════════════════════════════════════

router.post("/", async (req, res) => {

  const requestId = createRequestId();

  const startedAt = Date.now();


  console.log("");
  console.log("══════════════════════════════════════════════════");
  console.log("🔵 NEW TNT LEGAL AI REQUEST");
  console.log("Request ID:", requestId);
  console.log("══════════════════════════════════════════════════");


  try {

    // ═════════════════════════════════════════════════════════════════════════
    // 1. READ REQUEST
    // ═════════════════════════════════════════════════════════════════════════

    const body = req.body || {};

    const {
      messages,
      context = {},
      client = {},
    } = body;


    // ═════════════════════════════════════════════════════════════════════════
    // 2. BASIC VALIDATION
    // ═════════════════════════════════════════════════════════════════════════

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {

      console.warn(
        "⚠️ Invalid messages payload",
        {
          requestId,
          receivedType: typeof messages,
          isArray: Array.isArray(messages),
        }
      );


      return res.status(400).json({
        success: false,
        error: "Invalid message format",
        message:
          "messages must be a non-empty array.",
        requestId,
      });

    }


    // ═════════════════════════════════════════════════════════════════════════
    // 3. VALIDATE MESSAGE CONTENT
    // ═════════════════════════════════════════════════════════════════════════

    const cleanedMessages = messages
      .filter((message) => {

        if (!message || typeof message !== "object") {
          return false;
        }

        if (
          !["user", "assistant", "system"].includes(
            message.role
          )
        ) {
          return false;
        }

        if (
          typeof message.content !== "string"
        ) {
          return false;
        }

        return message.content.trim().length > 0;

      })
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }));


    if (cleanedMessages.length === 0) {

      return res.status(400).json({
        success: false,
        error: "No valid messages supplied.",
        requestId,
      });

    }


    // ═════════════════════════════════════════════════════════════════════════
    // 4. OPENAI KEY CHECK
    // ═════════════════════════════════════════════════════════════════════════

    if (!process.env.OPENAI_API_KEY) {

      console.error(
        "❌ OPENAI_API_KEY is missing",
        {
          requestId,
        }
      );


      return res.status(500).json({
        success: false,
        error: "AI service configuration error.",
        requestId,
      });

    }


    // ═════════════════════════════════════════════════════════════════════════
    // 5. NORMALIZE CONTEXT
    // ═════════════════════════════════════════════════════════════════════════

    const normalizedContext = {

      // Editor / document text
      editorText:
        typeof context?.editorText === "string"
          ? context.editorText.trim()
          : "",


      // Case
      caseId:
        context?.caseId ||
        null,


      // Documents
      documentIds:
        Array.isArray(context?.documentIds)
          ? context.documentIds
          : [],


      // Legal jurisdiction
      jurisdiction:
        context?.jurisdiction ||
        "India",


      // Court / forum
      court:
        context?.court ||
        null,


      // Optional future fields
      state:
        context?.state ||
        null,

      district:
        context?.district ||
        null,

      language:
        context?.language ||
        "English",

      mode:
        context?.mode ||
        "legal-ai",
    };


    // ═════════════════════════════════════════════════════════════════════════
    // 6. NORMALIZE CLIENT INFORMATION
    // ═════════════════════════════════════════════════════════════════════════

    const normalizedClient = {

      app:
        client?.app ||
        "TalkNType",

      version:
        client?.version ||
        "unknown",

      interface:
        client?.interface ||
        "legal-ai-chat",

    };


    // ═════════════════════════════════════════════════════════════════════════
    // 7. SAFE REQUEST LOGGING
    // ═════════════════════════════════════════════════════════════════════════
    //
    // IMPORTANT:
    // Do NOT log the actual legal conversation here.
    // Legal conversations may contain confidential client information.
    // ═════════════════════════════════════════════════════════════════════════

    console.log(
      "📱 Client:",
      normalizedClient
    );


    console.log(
      "💬 Messages:",
      cleanedMessages.length
    );


    console.log(
      "📚 Context:",
      {
        caseId:
          normalizedContext.caseId,

        documentCount:
          normalizedContext.documentIds.length,

        jurisdiction:
          normalizedContext.jurisdiction,

        court:
          normalizedContext.court,

        state:
          normalizedContext.state,

        district:
          normalizedContext.district,

        language:
          normalizedContext.language,

        mode:
          normalizedContext.mode,

        hasEditorText:
          Boolean(
            normalizedContext.editorText
          ),
      }
    );


    // ═════════════════════════════════════════════════════════════════════════
    // 8. RUN TNT LEGAL AI BRAIN
    // ═════════════════════════════════════════════════════════════════════════

    const result = await runLegalAI({

      messages:
        cleanedMessages,

      context:
        normalizedContext,

      client:
        normalizedClient,

      requestId,

    });


    // ═════════════════════════════════════════════════════════════════════════
    // 9. VALIDATE AI RESULT
    // ═════════════════════════════════════════════════════════════════════════

    if (
      !result ||
      typeof result !== "object"
    ) {

      console.error(
        "❌ Invalid result from aiOrchestrator",
        {
          requestId,
          resultType: typeof result,
        }
      );


      return res.status(502).json({
        success: false,
        error:
          "Invalid response from legal AI engine.",
        requestId,
      });

    }


    if (
      !result.reply ||
      typeof result.reply !== "string"
    ) {

      console.error(
        "❌ AI returned empty reply",
        {
          requestId,
        }
      );


      return res.status(502).json({
        success: false,
        error:
          "Legal AI returned an empty response.",
        requestId,
      });

    }


    // ═════════════════════════════════════════════════════════════════════════
    // 10. REQUEST TIMING
    // ═════════════════════════════════════════════════════════════════════════

    const duration =
      Date.now() - startedAt;


    console.log("");
    console.log(
      "✅ TNT AI RESPONSE GENERATED"
    );

    console.log(
      "Request ID:",
      requestId
    );

    console.log(
      "Intent:",
      result.intent ||
        "unknown"
    );

    console.log(
      "Legal Domain:",
      result.legalDomain ||
        "unknown"
    );

    console.log(
      "Duration:",
      `${duration}ms`
    );

    console.log(
      "══════════════════════════════════════════════════"
    );


    // ═════════════════════════════════════════════════════════════════════════
    // 11. RETURN RESPONSE
    // ═════════════════════════════════════════════════════════════════════════

    return res.status(200).json({

      success: true,

      reply:
        result.reply,


      // ─────────────────────────────────────────────────────────────────────
      // AI classification
      // ─────────────────────────────────────────────────────────────────────

      intent:
        result.intent ||
        "legal_question",

      legalDomain:
        result.legalDomain ||
        "general",


      // ─────────────────────────────────────────────────────────────────────
      // Sources
      // ─────────────────────────────────────────────────────────────────────

      sources:
        Array.isArray(result.sources)
          ? result.sources
          : [],


      // ─────────────────────────────────────────────────────────────────────
      // Verification
      // ─────────────────────────────────────────────────────────────────────

      verificationRequired:
        Boolean(
          result.verificationRequired
        ),


      // ─────────────────────────────────────────────────────────────────────
      // Legal context
      // ─────────────────────────────────────────────────────────────────────

      context: {

        jurisdiction:
          result.context?.jurisdiction ||
          normalizedContext.jurisdiction ||
          null,

        court:
          result.context?.court ||
          normalizedContext.court ||
          null,

        state:
          result.context?.state ||
          normalizedContext.state ||
          null,

        district:
          result.context?.district ||
          normalizedContext.district ||
          null,

        incidentDate:
          result.context?.incidentDate ||
          null,

        firDate:
          result.context?.firDate ||
          null,

        filingDate:
          result.context?.filingDate ||
          null,

        proceedingDate:
          result.context?.proceedingDate ||
          null,

        actsMentioned:
          Array.isArray(
            result.context?.actsMentioned
          )
            ? result.context.actsMentioned
            : [],

        sectionsMentioned:
          Array.isArray(
            result.context?.sectionsMentioned
          )
            ? result.context.sectionsMentioned
            : [],

        criminalTransition:
          result.context?.criminalTransition ||
          null,

      },


      // ─────────────────────────────────────────────────────────────────────
      // Generated document
      // ─────────────────────────────────────────────────────────────────────

      generatedDocument:
        result.generatedDocument ||
        null,


      // ─────────────────────────────────────────────────────────────────────
      // Technical information
      // ─────────────────────────────────────────────────────────────────────

      model:
        result.model ||
        null,

      requestId,

      durationMs:
        duration,

    });


  } catch (err) {

    // ═════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═════════════════════════════════════════════════════════════════════════

    const duration =
      Date.now() - startedAt;


    console.error("");
    console.error(
      "🔥 TNT LEGAL AI ERROR"
    );

    console.error(
      "Request ID:",
      requestId
    );

    console.error(
      "Duration:",
      `${duration}ms`
    );

    console.error(
      "Error:",
      err?.stack ||
        err?.message ||
        err
    );


    // Never expose API keys or complete internal objects
    // to the frontend.


    const errorMessage =
      err?.message ||
      "AI Processing Failed";


    // ─────────────────────────────────────────────────────────────────────────
    // Known configuration error
    // ─────────────────────────────────────────────────────────────────────────

    if (
      errorMessage
        .toLowerCase()
        .includes("openai")
    ) {

      return res.status(500).json({
        success: false,
        error:
          "AI service configuration error.",
        requestId,
      });

    }


    // ─────────────────────────────────────────────────────────────────────────
    // General AI error
    // ─────────────────────────────────────────────────────────────────────────

    return res.status(500).json({

      success: false,

      error:
        "AI Processing Failed",

      message:
        process.env.NODE_ENV === "production"
          ? "The legal AI service could not process this request."
          : errorMessage,

      requestId,

    });

  }

});


// ═════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export default router;