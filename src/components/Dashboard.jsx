import React, { useState, useCallback } from 'react'; 
// NOTE: Ensure these paths match your actual project structure
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar/Sidebar'; 
import Editor from './Editor'; 
import FooterButtons from './FooterButtons';

const Dashboard = () => {
    // --- 1. STATE: CONTENT (The Single Source of Truth) ---
    const [editorContent, setEditorContent] = useState('');
    const [voiceText, setVoiceText] = useState("");

    // --- 2. STATE: COMMANDS (Triggers sent to Editor) ---
    const [translationCommand, setTranslationCommand] = useState(null);
    const [transliterationCommand, setTransliterationCommand] = useState(null);
    const [fontConvertCommand, setFontConvertCommand] = useState(null); // 🟢 NEW

    // --- 3. STATE: LOADING (UI Feedback for Sidebar Buttons) ---
    const [isTranslating, setIsTranslating] = useState(false);
    const [isTransliterating, setIsTransliterating] = useState(false);
    const [isConverting, setIsConverting] = useState(false); // 🟢 NEW

    // --- HANDLERS ---

    // 1. Handle Voice Input coming from Sidebar/Microphone
    const handleSpeechInput = useCallback((text) => {
        setVoiceText(text);
    }, []);

    // 2. Handle Translation Button Click
    const handleTranslateCommand = (langCode) => {
        console.log("Dashboard: Sending Translation Request ->", langCode);
        setTranslationCommand({ 
            lang: langCode, 
            textToTranslate: editorContent, // Send current text state
            id: Date.now() // Unique ID to ensure useEffect fires even if lang is same
        });
    };

    // 3. Handle Transliteration Button Click
    const handleTransliterateCommand = (scriptCode) => {
        console.log("Dashboard: Sending Transliteration Request ->", scriptCode);
        setTransliterationCommand({
            script: scriptCode,
            textToTransliterate: editorContent,
            id: Date.now()
        });
    };
    
    // 4. Handle Font Convert Button Click (🟢 NEW)
    const handleFontConvertCommand = (fontCode) => {
        console.log("Dashboard: Sending Font Convert Request ->", fontCode);
        setFontConvertCommand({
            font: fontCode,
            textToConvert: editorContent,
            id: Date.now()
        });
    };

    // 5. Update Editor Content (Lifted State from Editor)
    const updateEditorContent = useCallback((newContent) => {
        setEditorContent(newContent);
    }, []);

    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
            
            {/* --- TOP: NAVBAR --- */}
            <div className="flex-none z-50 h-16 w-full shadow-sm">
                <DashboardNavbar />
            </div>
            
            {/* --- MIDDLE: WORKSPACE --- */}
            <div className="flex flex-1 overflow-hidden relative"> 
                
                {/* LEFT: Sidebar (Fixed Width) */}
                <div className="flex-none w-72 h-full overflow-y-auto border-r border-gray-200 bg-white">
                    <Sidebar 
                        onSpeechInput={handleSpeechInput} 
                        
                        // Pass Command Handlers
                        onTranslate={handleTranslateCommand} 
                        onTransliterate={handleTransliterateCommand} 
                        onFontConvert={handleFontConvertCommand} // 🟢
                        
                        // Pass Loading States (To show spinners on buttons)
                        isTranslating={isTranslating} 
                        isTransliterating={isTransliterating}
                        isConverting={isConverting} // 🟢
                    />
                </div>
                
                {/* RIGHT: Editor (Takes remaining space) */}
                <main className="flex-1 flex flex-col relative h-full bg-gray-50"> 
                    
                    <Editor 
                        // Data Props
                        speechText={voiceText} 
                        manualText={editorContent} 
                        setManualText={updateEditorContent} 

                        // Command Triggers (This "wires" the Sidebar to the Editor)
                        translationCommand={translationCommand}
                        transliterationCommand={transliterationCommand}
                        fontConvertCommand={fontConvertCommand} // 🟢

                        // State Setters (So Editor can tell Dashboard it's loading)
                        setIsTranslating={setIsTranslating} 
                        setIsTransliterating={setIsTransliterating} 
                        setIsConverting={setIsConverting} // 🟢
                        
                        // Loading Status (To show status bar at bottom of Editor)
                        isTranslating={isTranslating}
                        isTransliterating={isTransliterating}
                        isConverting={isConverting} // 🟢
                    />
                    
                </main>
            </div>

            {/* --- BOTTOM: FOOTER --- */}
            <div className="flex-none w-full bg-white border-t border-gray-200 z-50">
                <FooterButtons />
            </div>

        </div>
    );
};

export default Dashboard;