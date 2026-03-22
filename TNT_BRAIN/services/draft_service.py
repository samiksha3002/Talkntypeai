import os
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

def research_and_draft(facts, doc_type="Bail Application", lang="English"):
    if not os.path.exists(CHROMA_PATH):
        return ("Error: 'legal_db' folder missing.", "N/A", "N/A", "N/A", "N/A", "N/A")

    try:
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # Keep K=15 as per your original request for massive base
        retriever = vector_db.as_retriever(search_kwargs={"k": 15}) 
        docs = retriever.invoke(facts)
        context_text = "\n\n".join([doc.page_content for doc in docs])

        # Temperature 0.3 balance as per your logic
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3) 

        # --- THE MASTER DRAFTING COMMAND (Same logic, added new sections) ---
        system_prompt = (
            "You are a Senior Advocate at the Supreme Court of India. Your goal is to draft an EXHAUSTIVE, "
            "PROFESSIONAL, and HIGHLY DETAILED court bundle that spans 6 to 7 pages. "
            f"DOCUMENT TYPE: {doc_type}. LANGUAGE: {lang}."
            "\n\nSTRICT FORMATTING & CONTENT RULES:"
            "1. **TITLES & HEADINGS**: Must be in ALL CAPS and **BOLD**. Center the main title."
            "2. **SYNOPSIS**: Provide a 2-page detailed chronological narrative. A short synopsis is a failure."
            "3. **GROUNDS**: Provide at least 15 detailed grounds. Each ground must be 200 words long. "
            "   Start each ground with '**THAT...**'. Weave in legal logic and constitutional principles."
            "4. **JUDGMENTS PANEL**: In the ---JUDGMENTS--- section, list 3-4 REAL Landmark cases "
            "   (e.g., Arnesh Kumar vs State of Bihar, Rajesh Chaddha vs State of UP) with 2-line summaries."
            "5. **ARGUMENTS PANEL**: In the ---ARGUMENTS--- section, list 5 unique winning strategies for this case."
            "6. **STRATEGY & METER**: In the ---STRATEGY--- section, provide:"
            "   - WIN_PROBABILITY: [A numeric score out of 100]"
            "   - OPPONENT_ATTACK: [Predict 3 defense points from the other side]"
            "   - REBUTTAL: [How to counter those 3 points]"
            "7. **AFFIDAVIT**: In the ---AFFIDAVIT--- section, draft a formal 1-page Affidavit for the applicant."
            "8. **BOLDING**: Always bold Names, Dates, Section Numbers, and Case Citations."
            "\n\nOUTPUT MARKERS (STRICTLY USE THESE):"
            "\n---DRAFT---"
            "\n---AFFIDAVIT---"
            "\n---JUDGMENTS---"
            "\n---ARGUMENTS---"
            "\n---STRATEGY---"
            "\n---TIMELINE---"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "FACTS: {facts}\n\nLEGAL CONTEXT: {context}"),
        ])

        chain = prompt | llm | StrOutputParser()
        full_res = chain.invoke({"facts": facts, "context": context_text})

        # --- IMPROVED SPLITTING LOGIC (No logic change, just more markers) ---
        try:
            draft = full_res.split("---DRAFT---")[1].split("---AFFIDAVIT---")[0].strip()
            affidavit = full_res.split("---AFFIDAVIT---")[1].split("---JUDGMENTS---")[0].strip()
            judgments = full_res.split("---JUDGMENTS---")[1].split("---ARGUMENTS---")[0].strip()
            arguments = full_res.split("---ARGUMENTS---")[1].split("---STRATEGY---")[0].strip()
            strategy = full_res.split("---STRATEGY---")[1].split("---TIMELINE---")[0].strip()
            timeline = full_res.split("---TIMELINE---")[1].strip()
            
            # Logic check for AI laziness (Same as your original)
            if len(judgments) < 10: judgments = "Analyzing specific case laws for these facts..."
            if len(arguments) < 10: arguments = "Preparing winning arguments based on grounds..."
            
            # Returning ALL 6 elements now
            return draft, judgments, arguments, timeline, affidavit, strategy
        except:
            return full_res, "Landmark Judgments loading...", "Winning Arguments loading...", "Timeline loading...", "Affidavit loading...", "Strategy loading..."

    except Exception as e:
        return f"Drafting Error: {str(e)}", "N/A", "N/A", "N/A", "N/A", "N/A"

def ask_legal_ai(query):
    try:
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.5)
        response = llm.invoke(query)
        return response.content
    except Exception as e:
        return f"Legal Brain Error: {str(e)}"