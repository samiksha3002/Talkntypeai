import os
import fitz  # PyMuPDF
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

class OCRService:
    def __init__(self):
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0)

    def extract_text_from_scanned_pdf(self, file_path):
        """PDF ke har page ko image bana kar GPT Vision se text nikalna"""
        doc = fitz.open(file_path)
        full_text = ""
        
        print(f"--- Starting AI Vision OCR for: {file_path} ---")
        
        # Sirf pehle 3-5 pages analyze karein accuracy aur speed ke liye
        for page_num in range(min(len(doc), 5)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap()
            img_data = pix.tobytes("png")
            
            # GPT Vision ko image bhej kar text mangna
            message = HumanMessage(
                content=[
                    {"type": "text", "text": "Extract all legal text, names, and dates from this document image. Maintain the structure."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{pix.tobytes('base64').decode()}"}}
                ]
            )
            
            response = self.llm.invoke([message])
            full_text += f"\n[Page {page_num + 1}]\n" + response.content
            
        return full_text