import os
import requests
from tavily import TavilyClient
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

class ResearchService:
    def __init__(self):
        # API Keys fetch from .env
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.ik_token = os.getenv("INDIAN_KANOON_API_KEY")
        self.tavily = TavilyClient(api_key=self.tavily_api_key)
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0.2) # Keeping temp low for legal accuracy

    def perform_research(self, query):
        print(f"--- Starting Exhaustive Research for: {query} ---")
        
        # 1. Indian Kanoon Data (Focusing on full text for grounds)
        ik_docs = []
        try:
            ik_url = f"https://api.indiankanoon.org/search/?formdata=1&q={query}"
            headers = {"Authorization": f"Token {self.ik_token}"}
            res = requests.post(ik_url, headers=headers, timeout=12)
            if res.status_code == 200:
                ik_docs = res.json().get('docs', [])[:5] # Taking more docs for more content
                print("Indian Kanoon Data Fetched Successfully.")
        except Exception as e:
            print(f"Indian Kanoon Error: {e}")

        # 2. Tavily Web Search (Real-time 2026 Data)
        web_res = []
        try:
            # Targeted search for 2025-2026 precedents
            search = self.tavily.search(
                query=f"Detailed legal grounds, Supreme Court guidelines, and 2025-2026 judgments on {query} India", 
                search_depth="advanced", 
                max_results=6
            )
            web_res = search.get('results', [])
            print(f"Tavily Search Success: Found {len(web_res)} results.")
        except Exception as e:
            print(f"Tavily Search Error: {e}")

        # 3. AI Exhaustive Summary & Drafting Points Generation
        context_string = f"LIVE WEB SEARCH RESULTS (2024-2026):\n{web_res}\n\nVERIFIED STATUTES & CASE SUMMARIES:\n{ik_docs}"
        
        prompt = ChatPromptTemplate.from_template("""
            You are a Senior Supreme Court Researcher. Provide a highly detailed legal analysis for drafting a 6-7 page petition.
            
            CONTEXT PROVIDED:
            {context}
            
            USER QUESTION: {query}
            
            STRICT OUTPUT FORMAT (For Professional Drafting):
            - SECTION 1: Analysis Gist (Current legal standing in 2026)
            - SECTION 2: Key Statutes & Sections (Applicable IPC/BNSS/HMA sections)
            - SECTION 3: Recent Developments (Detailed 2025-2026 rulings with citations like 'Rajesh Chaddha v. State of UP')
            - SECTION 4: Exhaustive Grounds for Drafting (Provide 10-12 solid, long-form legal arguments that can be used directly in a draft to increase its length and quality)
            - SECTION 5: Case Strategy (How to argue this matter effectively in court)
        """)
        
        chain = prompt | self.llm | StrOutputParser()
        
        summary = chain.invoke({
            "query": query, 
            "context": context_string
        })

        return {
            "summary": summary,
            "verified_laws": ik_docs,
            "web_judgments": web_res
        }

    def get_marathi_summary(self, english_text):
        """English research summary ko professional Marathi legal summary mein convert karna"""
        print("--- Generating Marathi Legal Summary ---")
        
        marathi_prompt = ChatPromptTemplate.from_template("""
            You are a Senior Marathi Legal Expert. Summarize this English research into professional, high-court level Marathi.
            
            ENGLISH RESEARCH:
            {text}
            
            INSTRUCTIONS:
            1. Use formal Marathi legal terms (e.g., 'जामीन अर्ज' for Bail App, 'याचिका' for Petition).
            2. Structure it clearly so a lawyer can explain it to a local client in Nagpur/Maharashtra.
            3. Highlight the 2025-2026 developments specifically.
            
            OUTPUT FORMAT:
            - कायदेशीर विश्लेषण (Legal Analysis)
            - महत्त्वाचे कायदे व कलमे (Acts & Sections)
            - २०२५-२०२६ मधील महत्त्वाचे निकाल (2025-2026 Judgments)
            - बचावाचे मुद्दे (Defense Grounds - Detailed)
        """)
        
        marathi_chain = marathi_prompt | self.llm | StrOutputParser()
        return marathi_chain.invoke({"text": english_text})