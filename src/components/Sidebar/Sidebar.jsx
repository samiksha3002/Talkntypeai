import React from 'react';
import StenoCard from '../Sidebar/Stenocard';
import TranslationCard from '../Sidebar/TranslationCard';
import TransliterationCard from '../Sidebar/Transileration';
import FontConvertCard from './FontConvertCard';
// import FontConvertCard from './FontConvertCard'; // Add this when you create it

const Sidebar = ({ 
    onSpeechInput, 
    onTranslate, 
    onTransliterate, 
    onFontConvert,
    isTranslating, 
    isTransliterating,
    isConverting
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

            <FontConvertCard 
                onFontConvert={onFontConvert} // ⬅️ 3. Pass the handler
                isConverting={isConverting}   // ⬅️ 3. Pass the loading state
            />
            {/* 🅰️ CARD 4: FONT CONVERSION (Placeholder for your new feature) */}
            {/* <FontConvertCard /> */}

        </aside>
    );
};

export default Sidebar;