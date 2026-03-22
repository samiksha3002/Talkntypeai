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

# Load API Keys from .env
load_dotenv()

CHROMA_PATH = "legal_db"

# ==========================================
# 1. MAIN RESEARCH & DRAFTING ENGINE
# ==========================================
def research_and_draft(facts, doc_type="Bail Application", lang="English"):
    """
    Ye function 4 alag-alag legal components return karta hai.
    """
    if not os.path.exists(CHROMA_PATH):
        return (
            "Error: 'legal_db' folder missing. Run ingest_data.py first.",
            "Citations not found.",
            "Arguments not found.",
            "Timeline not available."
        )

    try:
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # Search for relevant BNS/BNSS context
        retriever = vector_db.as_retriever(search_kwargs={"k": 5})
        docs = retriever.invoke(facts)
        context_text = "\n\n".join([doc.page_content for doc in docs])

        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.2)

        system_prompt = (
            "You are a Senior Indian Legal Expert. Analyze the facts and provide a "
            "professional response divided into FOUR sections using exact markers.\n\n"
            "SECTION 1: LEGAL DRAFT\n"
            "Create a formal {doc_type} in {lang}. Use placeholders like [Name of Applicant].\n\n"
            "SECTION 2: LANDMARK JUDGMENTS\n"
            "Provide 2 relevant Supreme Court landmark cases with citations.\n\n"
            "SECTION 3: WINNING ARGUMENTS\n"
            "Provide 3 strong point-wise legal grounds for the bail/matter.\n\n"
            "SECTION 4: TABLE OF DATES (TIMELINE)\n"
            "Extract dates from the facts and present a simple chronology.\n\n"
            "STRICT FORMATTING: Use markers ---DRAFT---, ---JUDGMENTS---, ---ARGUMENTS---, ---TIMELINE---"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Facts: {facts}\n\nLegal Context: {context}"),
        ])

        chain = prompt | llm | StrOutputParser()
        full_res = chain.invoke({
            "facts": facts, 
            "context": context_text, 
            "doc_type": doc_type, 
            "lang": lang
        })

        # Parsing the response
        try:
            draft = full_res.split("---DRAFT---")[1].split("---JUDGMENTS---")[0].strip()
            judgments = full_res.split("---JUDGMENTS---")[1].split("---ARGUMENTS---")[0].strip()
            arguments = full_res.split("---ARGUMENTS---")[1].split("---TIMELINE---")[0].strip()
            timeline = full_res.split("---TIMELINE---")[1].strip()
            return draft, judgments, arguments, timeline
        except:
            return full_res, "See Draft.", "See Draft.", "Chronology not found."

    except Exception as e:
        return f"Error: {str(e)}", "N/A", "N/A", "N/A"

# ==========================================
# 2. CHAT & HELPER FUNCTION (Fixes ImportError)
# ==========================================
def ask_legal_ai(query):
    """
    Simple wrapper for Chat-with-PDF feature.
    """
    try:
        # Chat ke liye hum direct LLM use karenge with context
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.5)
        response = llm.invoke(query)
        return response.content
    except Exception as e:
        return f"Legal Brain Error: {str(e)}"

# ==========================================
# 3. SELF TEST
# ==========================================
if __name__ == "__main__":
    print("TNT Legal Brain Initializing...")
    d, j, a, t = research_and_draft("Bail for Section 103 BNS")
    print(f"Draft Length: {len(d)} chars")
    print(f"Judgments: {j[:50]}...")