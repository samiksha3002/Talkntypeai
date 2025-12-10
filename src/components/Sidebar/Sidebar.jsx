import React from 'react';
// ⚠️ NOTE: Ensure these import paths match your file structure.
// If these files are in the same folder as Sidebar.jsx, use './'
import StenoCard from './Stenocard'; 
import TranslationCard from './TranslationCard';
import TransliterationCard from './Transileration'; // Kept your original filename spelling
import FontConvertCard from './FontConvertCard'; 

const Sidebar = ({ 
    // Handlers (passed down from Dashboard)
    onSpeechInput, 
    onTranslate, 
    onTransliterate, 
    onFontConvert, 
    
    // Loading States (passed down from Dashboard)
    isTranslating, 
    isTransliterating,
    isConverting   
}) => {

    return (
        // 🟢 UPDATE: Removed 'fixed', 'h-screen', 'w-72'. 
        // The Dashboard wrapper now controls the width and scrolling.
        // We just use w-full to fill that wrapper and gap-4 for spacing.
        <aside className="w-full flex flex-col gap-4 p-4">
            
            {/* 🎙️ CARD 1: STENO */}
            <StenoCard 
                onSpeechInput={onSpeechInput} 
            />

            {/* 🈯 CARD 2: TRANSLATION */}
            <TranslationCard 
                onTranslate={onTranslate} 
                isTranslating={isTranslating} 
            />

            {/* ✍️ CARD 3: TRANSLITERATION */}
            <TransliterationCard 
                onTransliterate={onTransliterate} 
                isTransliterating={isTransliterating}
            />

            {/* 🅰️ CARD 4: FONT CONVERSION */}
            <FontConvertCard 
                onFontConvert={onFontConvert} 
                isConverting={isConverting}  
            />
            
        </aside>
    );
};

export default Sidebar;