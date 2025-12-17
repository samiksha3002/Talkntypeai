import React from 'react';
import StenoCard from './Stenocard'; 
import TranslationCard from './TranslationCard';
import TransliterationCard from './Transileration';
import FontConvertCard from './FontConvertCard'; 

const Sidebar = ({ 
  onSpeechInput, 
  onTranslate, 
  onTransliterate, 
  onFontConvert, 
  isTranslating, 
  isTransliterating,
  isConverting,
  editorText   // optional, if you want to validate text
}) => {
  return (
    <aside className="w-full flex flex-col gap-4 p-4">
      <StenoCard onSpeechInput={onSpeechInput} />

      <TranslationCard 
        onTranslate={onTranslate}   // ✅ fixed
        isTranslating={isTranslating}
        editorText={editorText}     // optional
      />

      <TransliterationCard 
        onTransliterate={onTransliterate} 
        isTransliterating={isTransliterating}
      />

      <FontConvertCard 
        onFontConvert={onFontConvert} 
        isConverting={isConverting}  
      />
    </aside>
  );
};

export default Sidebar;
