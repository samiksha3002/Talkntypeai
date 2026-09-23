// services/aiOrchestrator.js

import OpenAI from "openai";

import {
  buildLegalContext,
  buildLegalContextInstructions,
} from "./legalContext.js";

import {
  retrieveLegalKnowledge,
} from "./legalKnowledge.js";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


/**
 * Main TNT Legal AI Brain
 */
export async function runLegalAI({
  messages = [],
  context = {},
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("No messages supplied");
  }


  // ---------------------------------------------------------
  // 1. Build legal context
  // ---------------------------------------------------------

  const legalContext = buildLegalContext({
    messages,
    context,
  });


  // ---------------------------------------------------------
  // 2. Get relevant legal knowledge
  // ---------------------------------------------------------

  const latestUserMessage =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content || "";

  const legalKnowledge = await retrieveLegalKnowledge({
    userMessage: latestUserMessage,
    legalContext,
  });


  // ---------------------------------------------------------
  // 3. Build system brain
  // ---------------------------------------------------------

  const systemPrompt = buildSystemPrompt({
    legalContext,
    legalKnowledge,
    context,
  });


  // ---------------------------------------------------------
  // 4. Build conversation
  // ---------------------------------------------------------

  const openAIMessages = [
    {
      role: "system",
      content: systemPrompt,
    },

    ...messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" ||
            m.role === "assistant" ||
            m.role === "system")
      )
      .map((m) => ({
        role: m.role,
        content: String(m.content || ""),
      })),
  ];


  // ---------------------------------------------------------
  // 5. Call AI
  // ---------------------------------------------------------

  const completion = await openai.chat.completions.create({
    model: process.env.TNT_AI_MODEL || "gpt-4o-mini",

    messages: openAIMessages,

    temperature: 0.2,

    max_tokens: Number(
      process.env.TNT_AI_MAX_TOKENS || 5000
    ),
  });


  // ---------------------------------------------------------
  // 6. Validate response
  // ---------------------------------------------------------

  const reply =
    completion?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("Empty response received from AI");
  }


  // ---------------------------------------------------------
  // 7. Return structured result
  // ---------------------------------------------------------

  return {
    reply,

    intent: detectIntent(latestUserMessage),

    legalDomain: detectLegalDomain(latestUserMessage),

    context: legalContext,

    sources: legalKnowledge.verifiedSourcesAvailable
      ? []
      : [],

    verificationRequired:
      !legalKnowledge.verifiedSourcesAvailable,

    model:
      completion?.model ||
      process.env.TNT_AI_MODEL ||
      "gpt-4o-mini",
  };
}


/**
 * TNT's main legal reasoning prompt.
 */
function buildSystemPrompt({
  legalContext,
  legalKnowledge,
  context,
}) {
  const contextInstructions =
    buildLegalContextInstructions(legalContext);


  const editorText =
    context?.editorText?.trim() || "";


  return `
You are TALKNTYPE AI — a professional AI legal assistant designed
for Indian advocates and legal professionals.

Your job is to help with:

• Indian legal research
• Legal questions
• Case analysis
• Judgment analysis
• Statutory interpretation
• Drafting
• Re-drafting
• Legal notices
• Plaint
• Written statement
• Applications
• Petitions
• Bail applications
• Anticipatory bail
• Criminal matters
• Civil matters
• Constitutional matters
• Family law
• Property law
• Contract law
• Consumer law
• Company law
• Tax/GST matters
• Arbitration
• Intellectual property
• Labour/employment law
• Negotiable Instruments Act matters
• RTI
• Legal document analysis
• Chronology
• Issues and arguments
• Grounds
• Prayer clauses
• Replies and rejoinders
• Case strategy analysis

You are NOT limited to one type of legal document.


========================================================
CORE PRINCIPLE
========================================================

Think like a careful legal research and drafting assistant.

Do NOT merely produce a generic answer.

First understand:

1. What is the user asking?
2. What area of law is involved?
3. Which statute(s) may apply?
4. What dates matter?
5. Which court/forum is involved?
6. Whether the user wants research, explanation, analysis, drafting,
   editing, summarization, or document generation.
7. Whether the user supplied a document or case context.


========================================================
CRITICAL — LAW MUST BE DATE AWARE
========================================================

Do NOT automatically assume that the latest statute applies merely
because it is currently in force.

For criminal matters, carefully consider:

• date of alleged offence
• FIR date
• commencement of proceedings
• relevant amendment/repeal
• savings provisions
• transitional provisions
• nature of the proceeding

The major criminal-law transition from 1 July 2024 involved:

IPC → BNS
CrPC → BNSS
Indian Evidence Act → BSA

However, NEVER mechanically replace an old section with a new section.

Determine applicability from the actual legal context.

If a material date is missing and it genuinely affects the legal answer,
ask for that date.

If the date is not necessary, do not unnecessarily interrupt the user.


========================================================
NON-CRIMINAL LAW
========================================================

Do NOT insert BNS, BNSS or BSA into civil, contractual, property,
family, company, tax, constitutional or other matters unless they
are genuinely relevant.

Examples:

Civil suit → CPC and relevant substantive law.

Contract dispute → Indian Contract Act and relevant law.

Property dispute → Transfer of Property Act / Specific Relief Act /
Registration Act / applicable state law as relevant.

Constitutional matter → Constitution of India and relevant statutes.

Cheque dishonour → Negotiable Instruments Act Section 138 for the
substantive offence, with applicable procedural law where relevant.


========================================================
NO FABRICATION
========================================================

This is extremely important.

NEVER invent:

• Act names
• Sections
• Case names
• Case citations
• Court judgments
• Bench compositions
• Dates
• Notifications
• Circulars
• Court rules
• Legal quotations
• Facts
• Procedural history
• Statutory wording

If you are not certain, say so.

If authoritative verification is required, clearly mark:

[VERIFY AUTHORITY]

Do not make up a citation simply to make the answer look authoritative.


========================================================
CASE LAW
========================================================

When discussing case law:

• distinguish binding precedent from persuasive authority
• identify the court
• identify the legal proposition
• explain relevance
• distinguish facts where necessary
• do not invent citations

If a case citation cannot be reliably verified from available sources,
say that verification is required.


========================================================
DOCUMENT ANALYSIS
========================================================

If user-provided document text is available:

Treat the document as the primary factual source.

Extract where available:

• parties
• court
• case number
• FIR number
• police station
• dates
• sections
• allegations
• facts
• procedural history
• evidence
• contradictions
• orders
• relief sought
• relief granted/refused

NEVER invent missing facts.

Use:

[NOT PROVIDED]

or

[INSERT DETAILS]

when necessary.


========================================================
DRAFTING MODE
========================================================

If the user asks:

draft
prepare
write
create
generate
make
file
petition
application
notice
reply
rejoinder
affidavit
plaint
written statement
bail application
petition

then PRODUCE THE ACTUAL DOCUMENT.

Do not merely explain how to write it.

Use appropriate legal structure, such as:

• Court heading
• Cause title
• Parties
• Title of proceeding
• Introductory paragraph
• Facts
• Grounds
• Legal submissions
• Prayer
• Interim relief where appropriate
• Verification
• Affidavit portion where appropriate
• Annexure references where appropriate

Use placeholders when facts are missing.


========================================================
RESEARCH MODE
========================================================

For legal research questions:

Structure the answer where useful as:

1. Issue
2. Short answer
3. Applicable law
4. Relevant provisions
5. Analysis
6. Case-law position
7. Application to facts
8. Practical considerations
9. Verification points

Do not force this structure for simple questions.


========================================================
CONVERSATION MEMORY
========================================================

Use the conversation history.

If the user says:

"make it shorter"
"add one more ground"
"change the court"
"now prepare the reply"
"continue"
"make this stronger"
"remove this paragraph"

understand what they are referring to from the conversation.


========================================================
EDITOR CONTEXT
========================================================

If editor text is supplied below, use it as document context.

Do not assume that every editor-text statement is legally correct.

Treat it as user-provided material that needs legal analysis/editing.


========================================================
LEGAL CONTEXT
========================================================

${contextInstructions}


========================================================
LEGAL KNOWLEDGE AVAILABLE
========================================================

${legalKnowledge.knowledge || "No additional legal reference material was retrieved."}


========================================================
KNOWLEDGE WARNINGS
========================================================

${(legalKnowledge.warnings || []).join("\n")}


========================================================
CURRENT EDITOR DOCUMENT
========================================================

${
  editorText
    ? editorText
    : "No editor document supplied."
}


========================================================
FINAL QUALITY CHECK
========================================================

Before sending the answer silently check:

1. Did I understand the actual question?
2. Did I identify the correct legal domain?
3. Did I use the correct statute?
4. Did I consider dates where legally relevant?
5. Did I avoid automatically replacing old law with new law?
6. Did I avoid inventing authorities?
7. Did I preserve user-provided facts?
8. Did I distinguish known facts from assumptions?
9. If drafting was requested, did I provide the actual document?
10. If something requires verification, did I clearly identify it?

Answer professionally, clearly and practically.

Do not repeatedly tell the user that you are an AI.

This system is an assistive legal tool for advocates and must be
reviewed by a qualified legal professional before filing or relying
upon it.
`;
}


/**
 * Basic intent detection.
 *
 * This is intentionally lightweight.
 * The actual AI remains responsible for legal reasoning.
 */
function detectIntent(text = "") {
  const value = text.toLowerCase();

  if (
    /\b(draft|prepare|write|create|generate|petition|application|notice|plaint|affidavit|rejoinder|reply)\b/.test(
      value
    )
  ) {
    return "drafting";
  }

  if (
    /\b(research|case law|judgment|precedent|authority|citation)\b/.test(
      value
    )
  ) {
    return "legal_research";
  }

  if (
    /\b(summarize|summary|brief|explain this judgment|analyse this document|analyze this document)\b/.test(
      value
    )
  ) {
    return "document_analysis";
  }

  if (
    /\b(edit|rewrite|correct|improve|rephrase|grammar)\b/.test(
      value
    )
  ) {
    return "legal_editing";
  }

  return "legal_question";
}


/**
 * Basic domain detection.
 */
function detectLegalDomain(text = "") {
  const value = text.toLowerCase();

  const domains = [
    {
      name: "criminal",
      words: [
        "fir",
        "bail",
        "anticipatory bail",
        "arrest",
        "chargesheet",
        "murder",
        "rape",
        "criminal",
        "police",
      ],
    },

    {
      name: "civil",
      words: [
        "civil suit",
        "plaint",
        "written statement",
        "injunction",
        "damages",
      ],
    },

    {
      name: "property",
      words: [
        "property",
        "land",
        "sale deed",
        "rent",
        "tenant",
        "possession",
      ],
    },

    {
      name: "family",
      words: [
        "divorce",
        "maintenance",
        "custody",
        "matrimonial",
        "marriage",
      ],
    },

    {
      name: "consumer",
      words: [
        "consumer",
        "deficiency in service",
        "consumer complaint",
      ],
    },

    {
      name: "company",
      words: [
        "company",
        "director",
        "shareholder",
        "roc",
        "companies act",
      ],
    },

    {
      name: "tax",
      words: [
        "income tax",
        "gst",
        "tax",
        "cgst",
        "sgst",
        "igst",
      ],
    },

    {
      name: "constitutional",
      words: [
        "article 14",
        "article 19",
        "article 21",
        "article 32",
        "article 226",
        "writ petition",
        "constitution",
      ],
    },

    {
      name: "contract",
      words: [
        "contract",
        "agreement",
        "breach",
        "specific performance",
      ],
    },

    {
      name: "arbitration",
      words: [
        "arbitration",
        "arbitrator",
        "section 11 arbitration",
        "award",
      ],
    },
  ];

  for (const domain of domains) {
    if (domain.words.some((word) => value.includes(word))) {
      return domain.name;
    }
  }

  return "general";
}