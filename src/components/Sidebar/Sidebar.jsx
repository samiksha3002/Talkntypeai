import React from 'react';
import StenoCard from './Stenocard'; 
import TranslationCard from './TranslationCard';
import TransliterationCard from './TransliterationCard';
import FontConvertCard from './FontConvertCard'; 

const Sidebar = ({ 
  onSpeechInput, 
  onTransliterate, 
  onFontConvert, 
  isTransliterating, 
  isConverting,
  editorText,
  setManualText   // ✅ accept this from Dashboard
}) => {

  // Local check before sending transliteration command
  const handleTransliterate = (targetScript) => {
    if (!editorText || !editorText.trim()) {
      alert("⚠️ Please enter text in the editor first.");
      return;
    }
    
    if (onTransliterate) {
      onTransliterate(targetScript);
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
        {/* TranslationCard now handles its own API call and updates editor */}
        <TranslationCard 
          editorText={editorText} 
          onTranslationComplete={setManualText}  // ✅ pass directly
        />
      </div>

      <div className="flex-shrink-0">
        <TransliterationCard 
  editorText={editorText} 
  onTransliterationComplete={setManualText} 
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
