import os
import re
from dotenv import load_dotenv

# Pydantic compatibility hack for Python 3.13+
import pydantic
if not hasattr(pydantic, 'class_validators'):
    pydantic.class_validators = {} 

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()
CHROMA_PATH = "legal_db"

def research_and_draft(facts, doc_type=None, lang="English"):
    if not os.path.exists(CHROMA_PATH):
        return ("Error: 'legal_db' folder missing.", "N/A", "N/A", "N/A", "N/A", "N/A")

    try:
        # 1. STEP: DYNAMIC IDENTIFICATION (Isse 'Bail' ka bias khatam hoga)
        llm_gatekeeper = ChatOpenAI(model_name="gpt-4o", temperature=0)
        identity_prompt = f"Analyze these facts and provide ONLY the formal title of the legal petition needed. Facts: {facts}"
        detected_type = llm_gatekeeper.invoke(identity_prompt).content.strip()
        
        # Agar user ne doc_type nahi bheja, toh detected use karo
        final_doc_type = doc_type if doc_type else detected_type

        # 2. STEP: SMART VECTOR SEARCH
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # Hum facts aur detected_type dono ke basis par search karenge taaki sahi law mile
        retriever = vector_db.as_retriever(search_kwargs={"k": 10}) 
        docs = retriever.invoke(f"{final_doc_type} grounds and precedents: {facts}")
        context_text = "\n\n".join([doc.page_content for doc in docs])

        # 3. STEP: MASTER DRAFTING (Strictly Instruction based)
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.4) 

        # 🔥 FIX: Added CRITICAL FORMATTING BOUNDARIES to stop content mixing
        system_prompt = (
            "You are a Senior Advocate at the Supreme Court of India. Draft an EXHAUSTIVE court bundle. "
            f"DOCUMENT TYPE: {final_doc_type}. LANGUAGE: {lang}."
            "\n\nCRITICAL FORMATTING BOUNDARIES (DO NOT VIOLATE):"
            "\n1. The ---DRAFT--- section MUST ONLY contain the formal court petition (Heading, Facts, Grounds, Prayer)."
            "\n2. DO NOT include Landmark Judgments, Case Timeline, Strategy, or Arguments INSIDE the ---DRAFT--- section."
            "\n3. Keep Judgments, Timeline, and Strategy strictly contained within their designated output markers below."
            "\n\nCASE INSTRUCTIONS:"
            "\n1. NO BAIL CASES FOR CIVIL/DIVORCE: If this is a Divorce/Civil case, strictly avoid criminal citations like Arnesh Kumar. "
            "\n2. JUDGMENTS: Provide 3-4 REAL Landmark Judgments from the Supreme Court or High Courts specific to this case type."
            "\n3. SYNOPSIS: A detailed chronological narrative is mandatory."
            "\n4. GROUNDS: At least 15 grounds starting with '**THAT...**'. Each ~200 words."
            "\n\nOUTPUT MARKERS (DO NOT MISS THESE OR MIX CONTENT):"
            "\n---DRAFT---"
            "\n---AFFIDAVIT---"
            "\n---JUDGMENTS---"
            "\n---ARGUMENTS---"
            "\n---STRATEGY---"
            "\n---TIMELINE---"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "FACTS: {facts}\n\nDATABASE CONTEXT: {context}"),
        ])

        chain = prompt | llm | StrOutputParser()
        full_res = chain.invoke({"facts": facts, "context": context_text})

        # 4. STEP: PRECISION SPLITTING LOGIC (Clean layout fix)
        def get_section(text, start_marker, end_marker):
            try:
                pattern = f"{start_marker}(.*?){end_marker}"
                match = re.search(pattern, text, re.DOTALL)
                return match.group(1).strip() if match else ""
            except: return ""

        # Last section handling
        def get_last_section(text, start_marker):
            try:
                return text.split(start_marker)[-1].strip()
            except: return ""

        draft = get_section(full_res, "---DRAFT---", "---AFFIDAVIT---")
        affidavit = get_section(full_res, "---AFFIDAVIT---", "---JUDGMENTS---")
        judgments = get_section(full_res, "---JUDGMENTS---", "---ARGUMENTS---")
        arguments = get_section(full_res, "---ARGUMENTS---", "---STRATEGY---")
        strategy = get_section(full_res, "---STRATEGY---", "---TIMELINE---")
        timeline = get_last_section(full_res, "---TIMELINE---")

        # Layout Safety Check: Agar split fail hua toh full_res ko draft mein daalo
        if not draft:
            draft = full_res

        return draft, judgments, arguments, timeline, affidavit, strategy

    except Exception as e:
        return f"Drafting Error: {str(e)}", "N/A", "N/A", "N/A", "N/A", "N/A"

def ask_legal_ai(query):
    try:
        # GPT-4o use kar rahe hain legal queries ke liye
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.5)
        response = llm.invoke(query)
        return response.content
    except Exception as e:
        return f"Legal Brain Error: {str(e)}"