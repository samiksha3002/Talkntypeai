import React, { useState, useCallback } from 'react';

// Components
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar/Sidebar';
import Editor from '../Editor/Editor';  
import FooterButtons from './FooterButtons';

const Dashboard = () => {

    // ------------------------------------------
    // 1. MAIN EDITOR STATE (Single Source of Truth)
    // ------------------------------------------
    const [editorContent, setEditorContent] = useState('');
    const [voiceText, setVoiceText] = useState('');

    // ------------------------------------------
    // 2. COMMAND TRIGGERS (Fire → Editor will catch)
    // ------------------------------------------
    const [translationCommand, setTranslationCommand] = useState(null);
    const [transliterationCommand, setTransliterationCommand] = useState(null);
    const [fontConvertCommand, setFontConvertCommand] = useState(null); // 🟢 NEW COMMAND

    // ------------------------------------------
    // 3. LOADING STATES (UI Spinners & disable buttons)
    // ------------------------------------------
    const [isTranslating, setIsTranslating] = useState(false);
    const [isTransliterating, setIsTransliterating] = useState(false);
    const [isConverting, setIsConverting] = useState(false); // 🟢 NEW

    // ------------------------------------------
    // HANDLERS
    // ------------------------------------------

    // Voice input from sidebar microphone
    const handleSpeechInput = useCallback((text) => {
        setVoiceText(text);
    }, []);

    // Trigger translation action
    const handleTranslateCommand = (langCode) => {
        console.log("Dashboard → Translation Trigger:", langCode);
        setTranslationCommand({
            lang: langCode,
            textToTranslate: editorContent,
            id: Date.now()
        });
    };

    // Trigger transliteration action
    const handleTransliterateCommand = (scriptCode) => {
        console.log("Dashboard → Transliteration Trigger:", scriptCode);
        setTransliterationCommand({
            script: scriptCode,
            textToTransliterate: editorContent,
            id: Date.now()
        });
    };

    // Trigger FONT CONVERSION action (Mangal → KrutiDev, Shivaji, Priti etc.)
    const handleFontConvertCommand = (fontCode) => {
        console.log("Dashboard → Font Convert Trigger:", fontCode);
        setFontConvertCommand({
            font: fontCode,
            textToConvert: editorContent,
            id: Date.now()
        });
    };

    // Editor updates content
    const updateEditorContent = useCallback((newContent) => {
        setEditorContent(newContent);
    }, []);

    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">

            {/* -------- TOP NAVBAR -------- */}
            <div className="flex-none z-50 h-16 w-full shadow-sm">
                <DashboardNavbar />
            </div>

            {/* -------- MAIN LAYOUT WRAPPER -------- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* -------- SIDEBAR AREA -------- */}
                <div className="flex-none w-72 h-full overflow-y-auto border-r border-gray-200 bg-white">
                    <Sidebar
                        onSpeechInput={handleSpeechInput}

                        // Commands
                        onTranslate={handleTranslateCommand}
                        onTransliterate={handleTransliterateCommand}
                        onFontConvert={handleFontConvertCommand} // 🟢 NEW

                        // Loading Indicators
                        isTranslating={isTranslating}
                        isTransliterating={isTransliterating}
                        isConverting={isConverting} // 🟢 NEW
                    />
                </div>

                {/* -------- EDITOR AREA -------- */}
                <main className="flex-1 flex flex-col relative h-full bg-gray-50">

                    <Editor
                        // Data
                        speechText={voiceText}
                        manualText={editorContent}
                        setManualText={updateEditorContent}

                        // Command Triggers
                        translationCommand={translationCommand}
                        transliterationCommand={transliterationCommand}
                        fontConvertCommand={fontConvertCommand} // 🟢 NEW

                        // Loading Setters
                        setIsTranslating={setIsTranslating}
                        setIsTransliterating={setIsTransliterating}
                        setIsConverting={setIsConverting} // 🟢 NEW

                        // Actual state values
                        isTranslating={isTranslating}
                        isTransliterating={isTransliterating}
                        isConverting={isConverting} // 🟢 NEW
                    />

                </main>
            </div>

            {/* -------- FOOTER BUTTONS -------- */}
            <div className="flex-none w-full bg-white border-t border-gray-200 z-50">
                <FooterButtons />
            </div>

        </div>
    );
};

export default Dashboard;
