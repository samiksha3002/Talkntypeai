// services/legalContext.js

/**
 * Legal Context Engine
 *
 * Extracts useful legal context from the conversation/request.
 *
 * IMPORTANT:
 * This does NOT decide the final legal position.
 * It prepares context for the AI reasoning layer.
 */

export function buildLegalContext({
  messages = [],
  context = {},
}) {
  const conversationText = messages
    .map((m) => `${m.role || "user"}: ${m.content || ""}`)
    .join("\n");

  const editorText = context?.editorText || "";

  const fullText = `${conversationText}\n${editorText}`;

  const detected = {
    jurisdiction: context?.jurisdiction || "India",
    court: context?.court || null,

    caseId: context?.caseId || null,

    documentIds: Array.isArray(context?.documentIds)
      ? context.documentIds
      : [],

    incidentDate: extractDateByKeywords(fullText, [
      "incident",
      "offence",
      "offense",
      "occurred",
      "occurred on",
      "date of offence",
      "date of incident",
      "crime",
    ]),

    firDate: extractDateByKeywords(fullText, [
      "fir",
      "fir dated",
      "fir registered",
      "fir registration",
    ]),

    filingDate: extractDateByKeywords(fullText, [
      "filed",
      "filing",
      "petition filed",
      "suit filed",
      "application filed",
      "complaint filed",
    ]),

    proceedingDate: extractDateByKeywords(fullText, [
      "proceeding",
      "proceedings commenced",
      "case commenced",
      "petition instituted",
      "instituted",
    ]),

    sectionsMentioned: extractSections(fullText),

    actsMentioned: detectActs(fullText),

    criminalTransitionPossible: detectCriminalTransition(fullText),
  };

  return detected;
}


/**
 * Extract a date appearing close to one of the supplied keywords.
 */
function extractDateByKeywords(text, keywords = []) {
  if (!text) return null;

  const datePatterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
  ];

  for (const keyword of keywords) {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());

    if (index === -1) continue;

    const nearby = text.slice(
      Math.max(0, index - 150),
      Math.min(text.length, index + 300)
    );

    for (const pattern of datePatterns) {
      const match = pattern.exec(nearby);

      if (match?.[1]) {
        return match[1];
      }
    }
  }

  return null;
}


/**
 * Extract common Indian legal section references.
 *
 * Examples:
 * Section 138
 * Section 482 CrPC
 * Section 103 BNS
 * S. 420 IPC
 */
function extractSections(text) {
  if (!text) return [];

  const results = [];

  const patterns = [
    /\bsection\s+([0-9A-Za-z()\/\-]+)(?:\s*,?\s*([A-Za-z.\s]+))?/gi,
    /\bS\.\s*([0-9A-Za-z()\/\-]+)(?:\s*,?\s*([A-Za-z.\s]+))?/gi,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(text)) !== null) {
      results.push({
        section: match[1],
        actHint: match[2]?.trim() || null,
      });
    }
  }

  return dedupeObjects(results);
}


/**
 * Detect statutes mentioned in the request.
 *
 * This is intentionally only a detector.
 * It is NOT treated as legal verification.
 */
function detectActs(text) {
  if (!text) return [];

  const acts = [
    "Bharatiya Nyaya Sanhita",
    "BNS",
    "Bharatiya Nagarik Suraksha Sanhita",
    "BNSS",
    "Bharatiya Sakshya Adhiniyam",
    "BSA",
    "Indian Penal Code",
    "IPC",
    "Code of Criminal Procedure",
    "CrPC",
    "Indian Evidence Act",
    "IEA",
    "Code of Civil Procedure",
    "CPC",
    "Indian Contract Act",
    "Transfer of Property Act",
    "Specific Relief Act",
    "Negotiable Instruments Act",
    "Consumer Protection Act",
    "Companies Act",
    "Income Tax Act",
    "Arbitration and Conciliation Act",
    "Information Technology Act",
    "Constitution of India",
    "Hindu Marriage Act",
    "Hindu Succession Act",
    "Special Marriage Act",
    "Motor Vehicles Act",
    "Right to Information Act",
    "RTI Act",
  ];

  return acts.filter((act) =>
    text.toLowerCase().includes(act.toLowerCase())
  );
}


/**
 * Detect whether the matter may involve the
 * 1 July 2024 criminal-law transition.
 */
function detectCriminalTransition(text) {
  if (!text) return false;

  const criminalTerms = [
    "fir",
    "arrest",
    "bail",
    "anticipatory bail",
    "chargesheet",
    "charge sheet",
    "criminal case",
    "criminal complaint",
    "offence",
    "offense",
    "police",
    "investigation",
    "prosecution",
    "murder",
    "rape",
    "cheating",
    "criminal breach of trust",
  ];

  return criminalTerms.some((term) =>
    text.toLowerCase().includes(term)
  );
}


function dedupeObjects(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = JSON.stringify(item);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}


/**
 * Build instructions for the AI based on extracted context.
 */
export function buildLegalContextInstructions(context) {
  const lines = [];

  lines.push("JURISDICTION: India");

  if (context.court) {
    lines.push(`COURT/FORUM: ${context.court}`);
  }

  if (context.jurisdiction) {
    lines.push(`JURISDICTION PROVIDED BY USER: ${context.jurisdiction}`);
  }

  if (context.incidentDate) {
    lines.push(`POSSIBLE INCIDENT/OFFENCE DATE: ${context.incidentDate}`);
  }

  if (context.firDate) {
    lines.push(`POSSIBLE FIR DATE: ${context.firDate}`);
  }

  if (context.filingDate) {
    lines.push(`POSSIBLE FILING DATE: ${context.filingDate}`);
  }

  if (context.proceedingDate) {
    lines.push(`POSSIBLE PROCEEDING DATE: ${context.proceedingDate}`);
  }

  if (context.actsMentioned?.length) {
    lines.push(
      `ACTS MENTIONED BY USER: ${context.actsMentioned.join(", ")}`
    );
  }

  if (context.sectionsMentioned?.length) {
    lines.push(
      `SECTIONS MENTIONED BY USER: ${context.sectionsMentioned
        .map(
          (s) =>
            `${s.section}${s.actHint ? ` ${s.actHint}` : ""}`
        )
        .join(", ")}`
    );
  }

  if (context.criminalTransitionPossible) {
    lines.push(
      "CRIMINAL-LAW TRANSITION MAY BE RELEVANT. DETERMINE APPLICABLE LAW FROM THE FACTS AND DATES; DO NOT ASSUME SOLELY FROM THE CURRENT DATE."
    );
  }

  return lines.join("\n");
}