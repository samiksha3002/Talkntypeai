const draftTemplates = {
  "Civil Suit": {
    id: "civil-suit",

    name: "Civil Suit",

    category: "Civil Applications / Petitions",

    fields: [
      {
        name: "courtName",
        label: "Court Name",
        type: "text",
        placeholder: "Enter court name",
        required: true,
      },

      {
        name: "place",
        label: "Place",
        type: "text",
        placeholder: "Enter place",
        required: true,
      },

      {
        name: "plaintiffName",
        label: "Plaintiff Name",
        type: "text",
        placeholder: "Enter plaintiff name",
        required: true,
      },

      {
        name: "defendantName",
        label: "Defendant Name",
        type: "text",
        placeholder: "Enter defendant name",
        required: true,
      },

      {
        name: "natureOfSuit",
        label: "Nature of Suit",
        type: "text",
        placeholder: "Enter nature of suit",
        required: true,
      },

      {
        name: "briefFacts",
        label: "Brief Facts",
        type: "textarea",
        placeholder: "Enter facts of the case",
        required: true,
      },
    ],

    template: `
IN THE COURT OF {{courtName}}

Civil Suit No. _____ of _____

{{plaintiffName}}

Versus

{{defendantName}}

SUIT FOR {{natureOfSuit}}

MOST RESPECTFULLY SHOWETH:

{{briefFacts}}

PRAYER

It is therefore prayed that this Hon'ble Court may be pleased to pass appropriate orders.

Place: {{place}}

Date: __________

Plaintiff

{{plaintiffName}}
`,
  },
};

export const getDraftTemplate = (documentType) => {
  if (!documentType || typeof documentType !== "string") {
    return null;
  }

  const normalizedDocumentType = documentType.trim();

  return draftTemplates[normalizedDocumentType] || null;
};

export const generateDraft = (documentType, formData = {}) => {
  const template = getDraftTemplate(documentType);

  if (!template) {
    throw new Error(`Template not found for "${documentType}"`);
  }

  let draft = template.template;

  Object.entries(formData).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;

    const safeValue =
      value === null || value === undefined ? "" : String(value);

    draft = draft.split(placeholder).join(safeValue);
  });

  return draft;
};