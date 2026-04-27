import os
import re
from dotenv import load_dotenv

import pydantic
if not hasattr(pydantic, 'class_validators'):
    pydantic.class_validators = {}

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()
CHROMA_PATH = "legal_db"

# ✅ GLOBAL LLM OBJECTS - Memory bachane ke liye ek baar hi banenge
llm_gatekeeper = ChatOpenAI(model_name="gpt-4o", temperature=0, max_tokens=500)
llm_drafter = ChatOpenAI(model_name="gpt-4o", temperature=0.4, max_tokens=4096)
llm_chat = ChatOpenAI(model_name="gpt-4o", temperature=0.5, max_tokens=1000)
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

def research_and_draft(facts, doc_type=None, lang="English"):
    if not os.path.exists(CHROMA_PATH):
        return ("Error: 'legal_db' folder missing.", "N/A", "N/A", "N/A", "N/A", "N/A")

    try:
        # ==========================================
        # STEP 1: DETECT DOCUMENT TYPE
        # ==========================================
        identity_prompt = f"""Analyze these facts and return ONLY the formal Indian legal petition title needed.
Examples: 'Bail Application u/s 439 CrPC', 'Divorce Petition u/s 13 HMA', 
'Writ Petition (Criminal)', 'Consumer Complaint u/s 35 CP Act',
'Anticipatory Bail u/s 438 CrPC', 'Maintenance Application u/s 125 CrPC',
'Cheque Bounce Complaint u/s 138 NI Act', 'Injunction Application Order 39 CPC',
'FIR Quashing Petition u/s 482 CrPC', 'Custody Petition u/s 26 HMA'
Return ONLY the title, nothing else.
Facts: {facts}"""
        
        detected_type = llm_gatekeeper.invoke(identity_prompt).content.strip()
        final_doc_type = doc_type if doc_type else detected_type

        # ==========================================
        # STEP 2: LANGUAGE CONFIG
        # ==========================================
        lang_lower = lang.lower().strip()
        
        if "hindi" in lang_lower:
            lang_instruction = "HINDI"
            lang_detail = (
                "सम्पूर्ण ड्राफ्ट हिंदी में लिखें। "
                "न्यायालय की भाषा का प्रयोग करें। "
                "माननीय न्यायालय, याचिकाकर्ता, प्रतिवादी जैसे शब्दों का प्रयोग करें। "
                "सभी कानूनी धाराएं जैसे धारा 302, धारा 376 आदि हिंदी में लिखें।"
            )
        elif "marathi" in lang_lower:
            lang_instruction = "MARATHI"
            lang_detail = (
                "संपूर्ण मसुदा मराठी भाषेत लिहा. "
                "न्यायालयीन भाषेचा वापर करा. "
                "माननीय न्यायालय, अर्जदार, प्रतिवादी असे शब्द वापरा. "
                "सर्व कायदेशीर कलमे जसे कलम 302, कलम 376 इत्यादी मराठीत लिहा."
            )
        else:
            lang_instruction = "ENGLISH"
            lang_detail = (
                "Write entire draft in formal English legal language. "
                "Use terms like Honorable Court, Petitioner, Respondent, Applicant. "
                "All sections, acts, and citations in English."
            )

        # ==========================================
        # STEP 3: VECTOR DB SEARCH
        # ==========================================
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        retriever = vector_db.as_retriever(search_kwargs={"k": 12})
        docs = retriever.invoke(f"{final_doc_type} grounds precedents law sections: {facts}")
        context_text = "\n\n".join([doc.page_content for doc in docs])

        # ==========================================
        # STEP 4: MASTER SYSTEM PROMPT
        # ==========================================
        system_prompt = f"""You are a Senior Advocate with 30+ years of experience at the Supreme Court of India and various High Courts.
You specialize in drafting EXHAUSTIVE, LENGTHY, and LEGALLY IMPECCABLE court documents.

DOCUMENT TYPE: {final_doc_type}
OUTPUT LANGUAGE: {lang_instruction}
LANGUAGE INSTRUCTIONS: {lang_detail}

═══════════════════════════════════════
CRITICAL LENGTH & QUALITY REQUIREMENTS:
═══════════════════════════════════════

1. DRAFT SECTION (Minimum 2500-3500 words):
   - Full Court heading with case number placeholder
   - Complete party details (Petitioner/Respondent/Applicant)
   - Jurisdiction clause with relevant Article/Section
   - SYNOPSIS: Detailed 3-page chronological narrative of ALL facts
   - FACTS IN DETAIL: Numbered paragraphs (minimum 20 paragraphs), each 100-150 words
   - GROUNDS: Minimum 15-20 grounds, each starting with "THAT..." (150-200 words each)
     * Legal grounds with citations
     * Constitutional grounds if applicable
     * Factual grounds
     * Grounds of urgency/irreparable loss
   - PRAYER CLAUSE: Detailed prayer with (a)(b)(c)(d) sub-prayers
   - Advocate signature block with Bar Council details

2. AFFIDAVIT SECTION (Minimum 800-1000 words):
   - Complete verification affidavit
   - All facts in first person deponent language
   - Proper jurat and verification clause
   - Witness and notary section

3. JUDGMENTS SECTION (Minimum 600-800 words):
   - 5-6 REAL landmark judgments specific to {final_doc_type}
   - Format: Case Name v. Case Name (Year) Volume SCR/SCC Page
   - Ratio decidendi of each judgment (2-3 lines)
   - How it applies to current case
   - Recent judgments (post 2015) preferred

4. ARGUMENTS SECTION (Minimum 1000-1200 words):
   - Point-wise oral arguments for hearing
   - Opening statement
   - 8-10 argument points with legal backing
   - Anticipated counter-arguments and replies
   - Closing submission

5. STRATEGY SECTION (Minimum 500-600 words):
   - Immediate steps to take
   - Evidence to collect
   - Witnesses to prepare
   - Timeline for filing
   - Risk assessment
   - Alternative legal remedies

6. TIMELINE SECTION (Minimum 300-400 words):
   - Chronological table of all events
   - Date | Event | Legal Significance format
   - Include court dates if mentioned

═══════════════════════════════════════
DOCUMENT-TYPE SPECIFIC RULES:
═══════════════════════════════════════
- BAIL/ANTICIPATORY BAIL: Include personal liberty arguments, Article 21, no flight risk, custodial torture risk
- DIVORCE/MATRIMONIAL: Only use family law citations (NO criminal bail cases), include irretrievable breakdown
- CONSUMER: Include deficiency of service, unfair trade practice, compensation calculation
- CHEQUE BOUNCE: Include statutory presumption u/s 139, legally enforceable debt
- WRIT PETITION: Include fundamental rights violation, constitutional provisions, writ jurisdiction
- CUSTODY: Include best interest of child doctrine, welfare principle
- FIR QUASHING: Include abuse of process, inherent powers u/s 482 CrPC

═══════════════════════════════════════
MANDATORY OUTPUT FORMAT - USE EXACTLY:
═══════════════════════════════════════
---DRAFT---
[Complete petition/application - 2500-3500 words minimum]
---AFFIDAVIT---
[Complete supporting affidavit - 800-1000 words]
---JUDGMENTS---
[5-6 landmark cases with ratio - 600-800 words]
---ARGUMENTS---
[Detailed oral arguments - 1000-1200 words]
---STRATEGY---
[Case strategy and next steps - 500-600 words]
---TIMELINE---
[Chronological events table - 300-400 words]"""

        # ==========================================
        # STEP 5: HUMAN PROMPT
        # ==========================================
        human_prompt = """CASE FACTS PROVIDED BY CLIENT:
{facts}

RELEVANT LAW DATABASE CONTEXT:
{context}

IMPORTANT REMINDERS:
- Write in {lang} language throughout
- Minimum word counts MUST be met for each section
- Use REAL Indian case citations only
- Every ground must cite a specific law section or article
- Draft must be court-ready and professionally formatted"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_prompt),
        ])

        chain = prompt | llm_drafter | StrOutputParser()
        full_res = chain.invoke({
            "facts": facts,
            "context": context_text,
            "lang": lang_instruction
        })

        # ==========================================
        # STEP 6: PRECISION SECTION SPLITTING
        # ==========================================
        def get_section(text, start_marker, end_marker):
            try:
                pattern = f"{re.escape(start_marker)}(.*?){re.escape(end_marker)}"
                match = re.search(pattern, text, re.DOTALL)
                return match.group(1).strip() if match else ""
            except:
                return ""

        def get_last_section(text, start_marker):
            try:
                return text.split(start_marker)[-1].strip()
            except:
                return ""

        draft     = get_section(full_res, "---DRAFT---",     "---AFFIDAVIT---")
        affidavit = get_section(full_res, "---AFFIDAVIT---", "---JUDGMENTS---")
        judgments = get_section(full_res, "---JUDGMENTS---", "---ARGUMENTS---")
        arguments = get_section(full_res, "---ARGUMENTS---", "---STRATEGY---")
        strategy  = get_section(full_res, "---STRATEGY---",  "---TIMELINE---")
        timeline  = get_last_section(full_res, "---TIMELINE---")

        # Safety fallback
        if not draft:
            draft = full_res

        return draft, judgments, arguments, timeline, affidavit, strategy

    except Exception as e:
        return f"Drafting Error: {str(e)}", "N/A", "N/A", "N/A", "N/A", "N/A"


# ==========================================
# LEGAL AI CHAT (General Queries)
# ==========================================
def ask_legal_ai(query):
    try:
        system = """You are a Senior Legal Advisor specializing in Indian law.
Answer legal queries with:
- Relevant IPC/CrPC/CPC sections
- Applicable case laws
- Practical advice
- Clear step-by-step guidance
Be detailed but easy to understand."""
        
        response = llm_chat.invoke([
            ("system", system),
            ("human", query)
        ])
        return response.content
    except Exception as e:
        return f"Legal Brain Error: {str(e)}"