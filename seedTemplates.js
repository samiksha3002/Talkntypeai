import mongoose from "mongoose";
import dotenv from "dotenv";
import DraftTemplate from "./models/DraftTemplate.js";

dotenv.config({ path: ".env" });

const templates = [
  {
    title: "Rent Agreement",
    slug: "rent-agreement",
    category: "Property",
    country: "India",
    state: "Maharashtra",
    language: "English",
    description: "General residential rent agreement template.",
    status: "draft",
    version: 1,

    fields: [
      {
        name: "landlordName",
        label: "Landlord Name",
        type: "text",
        required: true,
      },
      {
        name: "tenantName",
        label: "Tenant Name",
        type: "text",
        required: true,
      },
      {
        name: "propertyAddress",
        label: "Property Address",
        type: "textarea",
        required: true,
      },
      {
        name: "monthlyRent",
        label: "Monthly Rent",
        type: "number",
        required: true,
      },
      {
        name: "agreementDate",
        label: "Agreement Date",
        type: "date",
        required: true,
      },
    ],

    templateBody: `
RENT AGREEMENT

This Rent Agreement is made on {{agreementDate}} between:

Landlord: {{landlordName}}

Tenant: {{tenantName}}

Property Address:
{{propertyAddress}}

Monthly Rent: ₹{{monthlyRent}}

The Tenant agrees to pay the monthly rent to the Landlord according to
the mutually agreed terms and conditions.

This is a general-purpose template and should be reviewed according
to the applicable local laws before execution.
`,
  },

  {
    title: "Payment Legal Notice",
    slug: "payment-legal-notice",
    category: "Legal Notice",
    country: "India",
    state: "",
    language: "English",
    description: "General notice for an unpaid amount.",
    status: "draft",
    version: 1,

    fields: [
      {
        name: "senderName",
        label: "Sender Name",
        type: "text",
        required: true,
      },
      {
        name: "senderAddress",
        label: "Sender Address",
        type: "textarea",
        required: true,
      },
      {
        name: "recipientName",
        label: "Recipient Name",
        type: "text",
        required: true,
      },
      {
        name: "amount",
        label: "Pending Amount",
        type: "number",
        required: true,
      },
      {
        name: "paymentDueDate",
        label: "Payment Due Date",
        type: "date",
        required: true,
      },
      {
        name: "noticeDate",
        label: "Notice Date",
        type: "date",
        required: true,
      },
    ],

    templateBody: `
LEGAL NOTICE FOR PAYMENT

Date: {{noticeDate}}

From:
{{senderName}}
{{senderAddress}}

To:
{{recipientName}}

Subject: Notice regarding outstanding payment

Dear Sir/Madam,

You are hereby requested to clear the outstanding amount of ₹{{amount}}
on or before {{paymentDueDate}}.

If the amount is not paid within the applicable period, the sender may
consider taking appropriate legal action in accordance with applicable law.

This is a general-purpose notice template and should be reviewed by
a qualified legal professional before being sent.
`,
  },

  {
    title: "Regular Bail Application",
    slug: "regular-bail-application",
    category: "Criminal Law",
    country: "India",
    state: "Maharashtra",
    language: "English",
    description: "General structure for a regular bail application.",
    status: "draft",
    version: 1,

    fields: [
      {
        name: "courtName",
        label: "Court Name",
        type: "text",
        required: true,
      },
      {
        name: "city",
        label: "City/District",
        type: "text",
        required: true,
      },
      {
        name: "applicantName",
        label: "Applicant/Accused Name",
        type: "text",
        required: true,
      },
      {
        name: "relativeName",
        label: "Father/Mother/Spouse Name",
        type: "text",
        required: true,
      },
      {
        name: "relation",
        label: "Relation",
        type: "select",
        options: ["Son", "Daughter", "Wife", "Husband"],
        required: true,
      },
      {
        name: "fullAddress",
        label: "Full Address",
        type: "textarea",
        required: true,
      },
      {
        name: "state",
        label: "State",
        type: "text",
        defaultValue: "Maharashtra",
        required: true,
      },
      {
        name: "firNumber",
        label: "FIR Number",
        type: "text",
        required: true,
      },
      {
        name: "sections",
        label: "Applicable Sections",
        type: "text",
        required: true,
      },
      {
        name: "policeStation",
        label: "Police Station",
        type: "text",
        required: true,
      },
      {
        name: "arrestDate",
        label: "Date of Arrest",
        type: "date",
        required: true,
      },
      {
        name: "currentDate",
        label: "Application Date",
        type: "date",
        required: true,
      },
    ],

    templateBody: `
IN THE COURT OF {{courtName}}, {{city}}

BAIL APPLICATION NO. ______ OF {{currentDate}}

IN THE MATTER OF:

{{applicantName}}
{{relation}} of {{relativeName}},
Resident of {{fullAddress}}
... Applicant / Accused

VERSUS

State of {{state}}
... Respondent / Prosecution

FIR No.: {{firNumber}}
Under Section: {{sections}}
Police Station: {{policeStation}}

APPLICATION FOR GRANT OF REGULAR BAIL

MOST RESPECTFULLY SHOWETH:

1. That the Applicant has been arrested on {{arrestDate}} in connection
with the above-mentioned FIR.

2. That the Applicant undertakes to abide by all conditions imposed
by the Hon'ble Court.

3. That the Applicant is ready and willing to furnish appropriate
bail bonds and sureties as directed by the Court.

PRAYER

It is most respectfully prayed that this Hon'ble Court may be pleased
to grant regular bail to the Applicant in connection with FIR No.
{{firNumber}} registered at Police Station {{policeStation}}.

PLACE: {{city}}
DATE: {{currentDate}}

Applicant/Accused:
{{applicantName}}

Note: This is a general structural template. A practicing advocate must
verify the applicable law, facts, grounds, court rules, and filing
requirements before submission.
`,
  },

  {
    title: "Civil Suit",
    slug: "civil-suit",
    category: "Civil Law",
    country: "India",
    state: "Maharashtra",
    language: "English",
    description: "General-purpose civil suit draft structure.",
    status: "draft",
    version: 1,

    fields: [
      {
        name: "courtName",
        label: "Court Name",
        type: "text",
        required: true,
      },
      {
        name: "city",
        label: "City/District",
        type: "text",
        required: true,
      },
      {
        name: "plaintiffName",
        label: "Plaintiff Name",
        type: "text",
        required: true,
      },
      {
        name: "defendantName",
        label: "Defendant Name",
        type: "text",
        required: true,
      },
      {
        name: "suitSubject",
        label: "Suit Subject",
        type: "text",
        required: true,
      },
      {
        name: "causeOfActionPlace",
        label: "Place Where Cause of Action Arose",
        type: "text",
        required: true,
      },
      {
        name: "caseFacts",
        label: "Facts of the Case",
        type: "textarea",
        required: true,
      },
      {
        name: "filingDate",
        label: "Filing Date",
        type: "date",
        required: true,
      },
      {
        name: "advocateName",
        label: "Advocate Name",
        type: "text",
        required: false,
      },
    ],

    templateBody: `
IN THE COURT OF {{courtName}}, {{city}}

Civil Suit No. ______ of ______

{{plaintiffName}}
... Plaintiff

VERSUS

{{defendantName}}
... Defendant

SUIT FOR {{suitSubject}}

MOST RESPECTFULLY SHOWETH:

1. That the Plaintiff is filing the present suit against the Defendant
for {{suitSubject}}.

2. That the cause of action arose at {{causeOfActionPlace}}.

3. That the facts of the case are as follows:

{{caseFacts}}

4. That the Plaintiff has approached this Hon'ble Court seeking
appropriate relief against the Defendant.

PRAYER

It is therefore most respectfully prayed that this Hon'ble Court may
be pleased to:

a. Pass appropriate orders in favour of the Plaintiff;

b. Grant any other relief which this Hon'ble Court may deem fit and
proper in the facts and circumstances of the case.

Place: {{city}}

Date: {{filingDate}}

Plaintiff:
{{plaintiffName}}

Through Counsel:
{{advocateName}}

Note: This is a general-purpose structural template. It must be
reviewed and modified by a qualified advocate according to the facts,
applicable law, court rules, and filing requirements.
`,
  },
];

async function seedTemplates() {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection string missing. Add MONGO_URI in your .env file."
      );
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully.");

    for (const template of templates) {
      await DraftTemplate.findOneAndUpdate(
        { slug: template.slug },
        template,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Seeded: ${template.title}`);
    }

    console.log("All templates inserted successfully.");
  } catch (error) {
    console.error("Template seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seedTemplates();