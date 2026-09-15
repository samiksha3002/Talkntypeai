import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DraftStudio.css";

const draftingSections = [
  {
    id: "court-applications",
    title: "Court Applications",
    documents: [
      "Bail Application", "Anticipatory Bail Application", "Regular Bail Application",
      "Interim Bail Application", "Default Bail Application", "Bail Cancellation Application",
      "Application for Modification of Bail Conditions", "Application for Relaxation of Bail Conditions",
      "Application for Extension of Bail", "Application for Temporary Bail",
      "Application for Exemption from Personal Appearance", "Application for Adjournment",
      "Application for Urgent Hearing", "Application for Early Hearing",
      "Application for Taking Documents on Record", "Application for Production of Documents",
      "Application for Calling Records", "Application for Issuance of Summons",
      "Application for Witness Summoning", "Application for Recall of Witness",
      "Application for Recalling / Reviewing Order", "Application for Restoration",
      "Application for Amendment", "Application for Condonation of Delay",
      "Application for Substitution of Parties", "Application for Withdrawal",
      "Application for Withdrawal of Proceedings", "Application for Compounding of Offence",
    ],
  },
  {
    id: "criminal",
    title: "Criminal Petitions / Proceedings",
    documents: [
      "Criminal Revision", "Criminal Appeal", "Criminal Writ Petition",
      "Petition under Section 482 CrPC", "Petition under Section 528 BNSS",
      "Petition for Quashing FIR", "Petition for Quashing Charge-sheet",
      "Petition for Quashing Criminal Proceedings", "Petition for Discharge",
      "Petition against Framing of Charge", "Petition for Transfer of Criminal Case",
      "Petition for Suspension of Sentence", "Petition for Parole / Furlough",
      "Petition for Return of Seized Property", "Petition for Defreezing Bank Account",
      "Petition for Cancellation of Non-Bailable Warrant", "Petition for Recall of Warrant",
    ],
  },
  {
    id: "civil",
    title: "Civil Applications / Petitions",
    documents: [
      "Civil Suit", "Interim Application", "Civil Miscellaneous Application",
      "Temporary Injunction Application", "Permanent Injunction Suit",
      "Application for Appointment of Receiver", "Application for Attachment",
      "Application for Amendment of Plaint / Written Statement", "Application for Rejection of Plaint",
      "Application for Restoration of Suit", "Application for Condonation of Delay",
      "Application for Execution", "Execution Petition", "Application for Stay of Execution",
      "Application for Summoning Documents", "Application for Discovery and Inspection",
      "Application for Appointment of Commissioner", "Application for Decree on Admission",
      "Application for Withdrawal of Suit", "Application for Compromise / Consent Terms",
    ],
  },
  {
    id: "high-court",
    title: "High Court Drafting",
    documents: [
      "Writ Petition", "Criminal Writ Petition", "Civil Writ Petition",
      "Criminal Application", "Interim Application", "Bail Application",
      "Anticipatory Bail Application", "Criminal Appeal", "Criminal Revision Application",
      "Civil Revision Application", "Contempt Petition", "Review Petition",
      "Recall Application", "Transfer Petition", "Quashing Petition", "PIL Petition",
    ],
  },
  {
    id: "supreme-court",
    title: "Supreme Court Drafting",
    documents: [
      "Special Leave Petition (SLP)", "Criminal SLP", "Civil SLP", "Criminal Appeal",
      "Civil Appeal", "Review Petition", "Curative Petition", "Transfer Petition",
      "Writ Petition", "Contempt Petition", "Interim Application", "Modification Application",
      "Clarification Application", "Recall Application", "Application for Bail",
      "Application for Suspension of Sentence",
    ],
  },
  {
    id: "trial-court",
    title: "Trial Court Documents",
    documents: [
      "Complaint", "Private Criminal Complaint", "Plaint", "Written Statement",
      "Replication", "Affidavit", "Evidence Affidavit", "Application", "Objection / Reply",
      "Say / Reply", "Written Arguments", "Oral Arguments Notes", "List of Documents",
      "List of Witnesses", "Memo of Evidence", "Compilation of Documents", "Pursis",
      "Vakalatnama", "Consent Terms", "Settlement Application",
    ],
  },
  {
    id: "notices",
    title: "Legal Notices & Pre-Litigation",
    documents: [
      "Legal Notice", "Demand Notice", "Reply to Legal Notice", "Notice of Termination",
      "Notice for Breach of Contract", "Recovery Notice", "Notice under Section 138 NI Act",
      "Reply to Section 138 Notice", "Consumer Complaint", "Consumer Legal Notice",
      "Arbitration Notice", "Notice Invoking Arbitration",
    ],
  },
  {
    id: "affidavits",
    title: "Affidavits & Supporting Documents",
    documents: [
      "Affidavit", "Affidavit-in-Reply", "Rejoinder Affidavit", "Affidavit of Evidence",
      "Affidavit of Service", "Affidavit of Undertaking", "Affidavit for Bail",
      "Verification", "Declaration", "Undertaking", "Authority Letter", "Memo of Appearance",
    ],
  },
  {
    id: "specialised",
    title: "Specialised Legal Drafting",
    documents: [
      "POCSO Matters", "NDPS Matters", "SC/ST Act Matters", "Atrocities Act Matters",
      "Domestic Violence Matters", "Negotiable Instruments Act Matters", "Motor Accident Claims",
      "Matrimonial Proceedings", "Maintenance Applications", "Juvenile Justice Matters",
      "Prevention of Corruption Act Matters", "Economic Offences", "Cyber Crime Matters",
      "Commercial Disputes", "Arbitration Matters", "Consumer Matters", "Property / Land Disputes",
      "Service Matters",
    ],
  },
];

const mostUsed = [
  "Bail Application",
  "Civil Suit",
  "Legal Notice",
  "Anticipatory Bail Application",
  "Written Statement",
  "Criminal Appeal",
];

export default function DraftStudio() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);

  // Yahan hum Database wale drafts ko store karenge ID match karne ke liye
  const [dbDrafts, setDbDrafts] = useState([]);

  // API Call to fetch drafts from Database
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/drafts/all');
        const result = await response.json();
        
        if (result.success) {
          setDbDrafts(result.data);
        }
      } catch (error) {
        console.error("Error fetching drafts from DB:", error);
      }
    };
    fetchDrafts();
  }, []);

  const allDocuments = useMemo(() => {
    return draftingSections.flatMap((section) =>
      section.documents.map((document) => ({
        document,
        section: section.title,
      }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return allDocuments.filter((item) =>
      item.document.toLowerCase().includes(query)
    );
  }, [search, allDocuments]);

  // Click handler me hum title ko DB drafts se match karenge taaki _id mil sake
  const handleDocumentClick = (documentTitle, sectionTitle) => {
    // Check agar ye title wala draft database me hai ya nahi
    const foundInDb = dbDrafts.find(d => d.title.toLowerCase() === documentTitle.toLowerCase());

    navigate("/draft/create", {
      state: {
        documentType: documentTitle,
        category: sectionTitle,
        draftId: foundInDb ? foundInDb._id : null, // Agar DB me hai to _id bhejo, warna null
      },
    });
  };

  return (
    <div className="draft-page">
      {/* TOP HEADER */}
      <header className="draft-topbar">
        <button className="draft-back" onClick={() => navigate("/dashboard")}>
          ← <span>Dashboard</span>
        </button>
        <div className="draft-brand">
          <div className="draft-brand-icon">D</div>
          <div>
            <h1>Legal Drafting</h1>
            <p>Professional Document Assistant</p>
          </div>
        </div>
        <button className="my-drafts" onClick={() => navigate("/drafts")}>
          <span>▣</span> My Drafts
        </button>
      </header>

      {/* HERO */}
      <section className="draft-hero">
        <div className="hero-text">
          <span className="hero-label">LEGAL DRAFTING STUDIO</span>
          <h2>What would you like to draft?</h2>
          <p>Select a legal document to begin preparing your professional draft.</p>
        </div>
        <div className="hero-decoration">
          <div className="paper-icon">▤</div>
        </div>
      </section>

      {/* SEARCH */}
      <div className="draft-search">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedSection(null);
          }}
          placeholder="Search for a legal document..."
        />
        {search && (
          <button className="clear-search" onClick={() => setSearch("")}>
            ×
          </button>
        )}
      </div>

      {/* SEARCH RESULTS */}
      {search.trim() ? (
        <section className="search-section">
          <div className="section-title">
            <h3>Search Results</h3>
            <span>{searchResults.length} documents</span>
          </div>
          {searchResults.length > 0 ? (
            <div className="document-grid">
              {searchResults.map((item, index) => (
                <DocumentCard
                  key={`${item.document}-${index}`}
                  document={item.document}
                  section={item.section}
                  onClick={handleDocumentClick}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div>⌕</div>
              <h3>No document found</h3>
              <p>Try searching for another legal document.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* MOST USED */}
          <section className="draft-section">
            <div className="section-title">
              <div>
                <h3>Most Used Documents</h3>
                <p>Quick access to frequently prepared documents</p>
              </div>
            </div>
            <div className="document-grid">
              {mostUsed.map((document, index) => {
                const section = draftingSections.find((item) =>
                  item.documents.includes(document)
                );
                return (
                  <DocumentCard
                    key={`${document}-${index}`}
                    document={document}
                    section={section?.title}
                    mostUsed
                    onClick={handleDocumentClick}
                  />
                );
              })}
            </div>
          </section>

          {/* ALL CATEGORIES */}
          {draftingSections.map((section) => {
            if (selectedSection && selectedSection !== section.id) {
              return null;
            }
            return (
              <section className="draft-section" key={section.id}>
                <div className="section-title">
                  <div>
                    <h3>{section.title}</h3>
                    <p>Select a document to start drafting</p>
                  </div>
                  <button
                    className="view-all"
                    onClick={() =>
                      setSelectedSection(
                        selectedSection === section.id ? null : section.id
                      )
                    }
                  >
                    {selectedSection === section.id
                      ? "Show All"
                      : `View All (${section.documents.length})`}
                  </button>
                </div>
                <div className="document-grid">
                  {section.documents
                    .slice(0, selectedSection === section.id ? undefined : 6)
                    .map((document, index) => (
                      <DocumentCard
                        key={`${document}-${index}`}
                        document={document}
                        section={section.title}
                        onClick={handleDocumentClick}
                      />
                    ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function DocumentCard({ document, section, mostUsed, onClick }) {
  return (
    <button
      className="draft-document-card"
      onClick={() => onClick(document, section)}
    >
      <div className="document-left">
        <div className="document-icon">
          <span>▤</span>
        </div>
        <div className="document-content">
          <h4>{document}</h4>
          <div className="document-meta">
            {mostUsed && <span className="most-used-badge">Most Used</span>}
            {!mostUsed && <span>{section || "Legal Document"}</span>}
          </div>
        </div>
      </div>
      <span className="document-arrow">→</span>
    </button>
  );
}