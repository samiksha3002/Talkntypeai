// services/legalKnowledge.js

const TRANSITION_DATE = new Date("2024-07-01T00:00:00Z");

const VERIFIED_RULES = {

  criminalTransition: {
    date: "2024-07-01",

    oldLaws: {
      penal: "Indian Penal Code, 1860 (IPC)",
      procedure: "Code of Criminal Procedure, 1973 (CrPC)",
      evidence: "Indian Evidence Act, 1872 (IEA)",
    },

    newLaws: {
      penal: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      procedure: "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
      evidence: "Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
    },
  },


  sectionMappings: [

    {
      oldAct: "CrPC",
      oldSection: "482",
      subject: "High Court inherent powers",
      newAct: "BNSS",
      newSection: "528",
    },

    {
      oldAct: "CrPC",
      oldSection: "438",
      subject: "Anticipatory bail",
      newAct: "BNSS",
      newSection: "482",
    },

    {
      oldAct: "CrPC",
      oldSection: "437/439",
      subject: "Regular bail",
      newAct: "BNSS",
      newSection: "480/483",
    },

    {
      oldAct: "CrPC",
      oldSection: "154",
      subject: "FIR registration",
      newAct: "BNSS",
      newSection: "173",
    },

    {
      oldAct: "CrPC",
      oldSection: "173",
      subject: "Investigation / police report",
      newAct: "BNSS",
      newSection: "193",
    },

    {
      oldAct: "IPC",
      oldSection: "302",
      subject: "Murder",
      newAct: "BNS",
      newSection: "103",
    },

    {
      oldAct: "IPC",
      oldSection: "307",
      subject: "Attempt to murder",
      newAct: "BNS",
      newSection: "109",
    },

    {
      oldAct: "IPC",
      oldSection: "420",
      subject: "Cheating",
      newAct: "BNS",
      newSection: "318(4)",
    },

  ],
};


/**
 * Determine transition status from a date.
 *
 * IMPORTANT:
 * This is only a date classifier.
 * It does not itself decide the ultimate legal applicability.
 */
export function determineCriminalTransition(dateString) {

  if (!dateString) {
    return {
      status: "UNKNOWN",
      reason:
        "Relevant criminal-law date was not provided.",
    };
  }

  const date = parseIndianDate(dateString);

  if (!date) {
    return {
      status: "UNKNOWN",
      reason:
        `Could not reliably parse date: ${dateString}`,
    };
  }

  if (date < TRANSITION_DATE) {
    return {
      status: "PRE_TRANSITION",
      date: dateString,
      reason:
        "The alleged offence date precedes 1 July 2024.",
      likelyFramework:
        "IPC/CrPC/IEA transition must be examined.",
    };
  }

  return {
    status: "POST_TRANSITION",
    date: dateString,
    reason:
      "The alleged offence date is on or after 1 July 2024.",
    likelyFramework:
      "BNS/BNSS/BSA framework may apply, subject to applicable transition provisions.",
  };
}


/**
 * Find exact section mappings.
 */
export function findSectionMappings(text = "") {

  const value = text.toLowerCase();

  return VERIFIED_RULES.sectionMappings.filter((item) => {

    const oldMatch =
      value.includes(
        `${item.oldAct.toLowerCase()} ${item.oldSection.toLowerCase()}`
      );

    const newMatch =
      value.includes(
        `${item.newAct.toLowerCase()} ${item.newSection.toLowerCase()}`
      );

    const subjectMatch =
      value.includes(
        item.subject.toLowerCase()
      );

    return oldMatch || newMatch || subjectMatch;
  });
}


/**
 * Retrieve relevant verified knowledge.
 */
export function retrieveVerifiedLegalKnowledge({
  userMessage = "",
  legalContext = {},
}) {

  const mappings =
    findSectionMappings(userMessage);


  let transition = null;

  if (legalContext?.incidentDate) {
    transition =
      determineCriminalTransition(
        legalContext.incidentDate
      );
  }


  const facts = [];


  // Section mapping facts
  for (const mapping of mappings) {

    facts.push(
      `${mapping.oldAct} Section ${mapping.oldSection}: ${mapping.subject}. ` +
      `Corresponding ${mapping.newAct} provision: Section ${mapping.newSection}.`
    );

  }


  // Transition fact
  if (transition) {

    facts.push(
      `Criminal transition status: ${transition.status}. ` +
      transition.reason
    );

  }


  return {
    transition,
    mappings,
    facts,
  };
}