import React, { useState } from 'react';
import StenoCard from './Stenocard'; 
import TranslationCard from './TranslationCard';
import TransliterationCard from './TransliterationCard';
import FontConvertCard from './FontConvertCard'; 

const Sidebar = ({ 
  onSpeechInput, 
  onTranslate, 
  onFontConvert, 
  isTranslating, 
  isConverting,
  editorText,
  setManualText
}) => {
  const [isTransliterating, setIsTransliterating] = useState(false);

  const handleTransliterate = async (targetScript) => {
    if (!editorText || !editorText.trim()) {
      alert("⚠️ Please enter text in the editor first.");
      return;
    }

    try {
      setIsTransliterating(true);

      const res = await fetch("http://localhost:5000/api/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editorText,
          sourceLang: "hi",         
          targetLang: "hi",         
          // targetScript: 'en' from UI maps to 'Latn', anything else to 'Deva'
          targetScript: targetScript === "en" ? "Latn" : "Deva"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || "Transliteration API failed");
      }

      // Update the editor with the new transliterated text
      setManualText(data.transliteratedText || "");
    } catch (err) {
      console.error("Transliteration failed:", err);
      alert(`Transliteration Error: ${err.message}`);
    } finally {
      setIsTransliterating(false);
    }
  };

  return (
    <aside 
      className="w-full flex flex-col gap-3 p-3 overflow-y-auto"
      style={{ height: 'calc(100vh - 160px)', scrollbarWidth: 'thin' }}
    >
      <div className="flex-shrink-0">
        <StenoCard onSpeechInput={onSpeechInput} />
      </div>

      <div className="flex-shrink-0">
        <TranslationCard 
          onTranslate={onTranslate}  
          isTranslating={isTranslating}
          editorText={editorText} 
        />
      </div>

      <div className="flex-shrink-0">
        <TransliterationCard 
          onTransliterate={handleTransliterate} 
          isTransliterating={isTransliterating}
          editorText={editorText} 
        />
      </div>

      <div className="flex-shrink-0">
        <FontConvertCard 
          onFontConvert={onFontConvert} 
          isConverting={isConverting} 
          editorText={editorText} 
        />
      </div>

      <div className="h-10 flex-shrink-0"></div>
    </aside>
  );
};

export default Sidebar;