import React from 'react';
import StenoCard from './Stenocard'; 
import TranslationCard from './TranslationCard';
import TransliterationCard from './TransliterationCard';
import FontConvertCard from './FontConvertCard'; 

const Sidebar = ({ 
  onSpeechInput, 
  onTranslate, 
  onTransliterate, 
  onFontConvert, 
  isTranslating, 
  isTransliterating,
  isConverting,
  editorText 
}) => {
  return (
    <aside 
      className="w-full flex flex-col gap-3 p-3 overflow-y-auto"
      style={{ 
        height: 'calc(100vh - 160px)', // Footer aur Header ke beech fit karne ke liye
        scrollbarWidth: 'thin',        // Firefox ke liye chota scrollbar
      }}
    >
      {/* Har card ko 'flex-shrink-0' diya hai taaki wo pichke nahi, 
          aur humne gap-3 use kiya hai space bachane ke liye 
      */}
      
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
          onTransliterate={onTransliterate} 
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

      {/* Ek extra space niche taaki last button status bar ke piche na jaye */}
      <div className="h-10 flex-shrink-0"></div>
    </aside>
  );
};

export default Sidebar;