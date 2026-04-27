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
from openai import OpenAI  # ✅ Direct OpenAI for streaming

load_dotenv()
CHROMA_PATH = "legal_db"

# ✅ Global objects
client = OpenAI()  # Direct client for streaming
llm_gatekeeper = ChatOpenAI(model_name="gpt-4o", temperature=0, max_tokens=200)
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")


# ==========================================
# STREAMING VERSION - Draft Generator
# ==========================================
def research_and_draft_stream(facts, doc_type=None, lang="English"):
    """
    Ye function ek GENERATOR hai.
    Har token aate hi yield karta hai - frontend ko instantly milta hai.
    """
    if not os.path.exists(CHROMA_PATH):
        yield "[ERROR] legal_db folder missing."
        return

    try:
        # STEP 1: Detect document type
        identity_prompt = f"""Analyze these facts and return ONLY the formal Indian legal petition title.
Examples: 'Bail Application u/s 439 CrPC', 'Divorce Petition u/s 13 HMA',
'Writ Petition (Criminal)', 'Consumer Complaint u/s 35 CP Act',
'Anticipatory Bail u/s 438 CrPC', 'Maintenance Application u/s 125 CrPC',
'Cheque Bounce Complaint u/s 138 NI Act', 'FIR Quashing Petition u/s 482 CrPC'
Return ONLY the title.
Facts: {facts}"""
        detected_type = llm_gatekeeper.invoke(identity_prompt).content.strip()
        final_doc_type = doc_type if doc_type else detected_type

        # STEP 2: Language config
        lang_lower = lang.lower().strip()
        if "hindi" in lang_lower:
            lang_instruction = "HINDI"
            lang_detail = "सम्पूर्ण ड्राफ्ट हिंदी में लिखें। न्यायालय की भाषा का प्रयोग करें।"
        elif "marathi" in lang_lower:
            lang_instruction = "MARATHI"
            lang_detail = "संपूर्ण मसुदा मराठी भाषेत लिहा. न्यायालयीन भाषेचा वापर करा."
        else:
            lang_instruction = "ENGLISH"
            lang_detail = "Write entire draft in formal English legal language."

        # STEP 3: Vector DB search
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        retriever = vector_db.as_retriever(search_kwargs={"k": 12})
        docs = retriever.invoke(f"{final_doc_type} grounds precedents: {facts}")
        context_text = "\n\n".join([doc.page_content for doc in docs])

        # STEP 4: System prompt (same as before - full quality)
        system_prompt = f"""You are a Senior Advocate with 30+ years experience at Supreme Court of India.
Draft an EXHAUSTIVE, LENGTHY, LEGALLY IMPECCABLE court document.

DOCUMENT TYPE: {final_doc_type}
OUTPUT LANGUAGE: {lang_instruction}
LANGUAGE INSTRUCTIONS: {lang_detail}

REQUIREMENTS:
1. DRAFT (2500-3500 words): Full heading, party details, Synopsis 3-pages, 
   20+ fact paragraphs, 15-20 GROUNDS each starting THAT... with citations,
   detailed Prayer clause (a)(b)(c)(d)
2. AFFIDAVIT (800-1000 words): Complete verification, first person, jurat
3. JUDGMENTS (600-800 words): 5-6 REAL landmark cases with ratio decidendi
4. ARGUMENTS (1000-1200 words): 8-10 argument points, counter-arguments
5. STRATEGY (500-600 words): Steps, evidence, witnesses, timeline
6. TIMELINE (300-400 words): Date | Event | Legal Significance table

DOCUMENT RULES:
- BAIL: Article 21, personal liberty, no flight risk
- DIVORCE: Only family law citations, irretrievable breakdown
- CONSUMER: Deficiency of service, compensation calculation
- CHEQUE BOUNCE: Statutory presumption u/s 139
- WRIT: Fundamental rights, constitutional provisions
- FIR QUASHING: Abuse of process, inherent powers u/s 482

MANDATORY FORMAT:
---DRAFT---
[complete petition]
---AFFIDAVIT---
[complete affidavit]
---JUDGMENTS---
[landmark cases]
---ARGUMENTS---
[oral arguments]
---STRATEGY---
[case strategy]
---TIMELINE---
[chronological table]"""

        # ✅ STEP 5: STREAMING API CALL
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"FACTS: {facts}\n\nLAW DATABASE: {context_text}\n\nWrite in {lang_instruction} language."}
            ],
            max_tokens=4096,
            temperature=0.4,
            stream=True  # ✅ YE KEY HAI
        )

        # ✅ STEP 6: Token by token yield karo
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta  # Har token frontend ko bhejo

    except Exception as e:
        yield f"\n[DRAFTING ERROR]: {str(e)}"


# ==========================================
# NON-STREAMING (backward compat) - Chat
# ==========================================
def research_and_draft(facts, doc_type=None, lang="English"):
    """Old non-streaming version - PDF draft ke liye use hoti hai"""
    full_text = ""
    for chunk in research_and_draft_stream(facts, doc_type, lang):
        full_text += chunk

    def get_section(text, start, end):
        try:
            match = re.search(f"{re.escape(start)}(.*?){re.escape(end)}", text, re.DOTALL)
            return match.group(1).strip() if match else ""
        except:
            return ""

    def get_last(text, start):
        try:
            return text.split(start)[-1].strip()
        except:
            return ""

    draft     = get_section(full_text, "---DRAFT---",     "---AFFIDAVIT---")
    affidavit = get_section(full_text, "---AFFIDAVIT---", "---JUDGMENTS---")
    judgments = get_section(full_text, "---JUDGMENTS---", "---ARGUMENTS---")
    arguments = get_section(full_text, "---ARGUMENTS---", "---STRATEGY---")
    strategy  = get_section(full_text, "---STRATEGY---",  "---TIMELINE---")
    timeline  = get_last(full_text, "---TIMELINE---")

    if not draft:
        draft = full_text

    return draft, judgments, arguments, timeline, affidavit, strategy


def ask_legal_ai(query):
    try:
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a Senior Legal Advisor specializing in Indian law. Answer with relevant sections, case laws, and practical guidance."},
                {"role": "user", "content": query}
            ],
            max_tokens=1000,
            temperature=0.5,
            stream=True
        )
        result = ""
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                result += delta
        return result
    except Exception as e:
        return f"Legal Brain Error: {str(e)}"