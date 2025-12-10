import React from 'react';
import StenoCard from '../Sidebar/Stenocard';
import TranslationCard from '../Sidebar/TranslationCard';
import TransliterationCard from '../Sidebar/Transileration';
import FontConvertCard from './FontConvertCard'; // Keep this import

const Sidebar = ({ 
    onSpeechInput, 
    onTranslate, 
    onTransliterate, 
    onFontConvert, // New prop received
    isTranslating, 
    isTransliterating,
    isConverting   // New prop received
}) => {

    return (
        <aside className="w-72 bg-white h-[calc(100vh-128px)] border-r border-gray-200 p-4 overflow-y-auto fixed left-0 top-16 z-40">
            
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