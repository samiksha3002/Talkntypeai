import React, { useState, useCallback } from 'react'; 
// NOTE: Assuming Sidebar, Editor, Navbar, and FooterButtons are now direct siblings.
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar/Sidebar'; 
import Editor from './Editor'; 
import FooterButtons from './FooterButtons';

const Dashboard = () => {
    // 1. STATE FOR EDITOR CONTENT (The single source of truth for the text)
    const [editorContent, setEditorContent] = useState('');

    // 2. State to hold the live text coming from the Sidebar (Voice)
    const [voiceText, setVoiceText] = useState("");

    // 3. States to hold the Command Triggers (Sent to Editor to start API calls)
    const [translationCommand, setTranslationCommand] = useState(null);
    const [transliterationCommand, setTransliterationCommand] = useState(null);
    // ⚠️ NEW: Font Conversion Command Trigger
    const [fontConvertCommand, setFontConvertCommand] = useState(null);

    // 4. States for Loading Indicators (Passed to Sidebar to disable buttons)
    const [isTranslating, setIsTranslating] = useState(false);
    const [isTransliterating, setIsTransliterating] = useState(false);
    // ⚠️ NEW: Font Conversion Loading State
    const [isConverting, setIsConverting] = useState(false);

    // --- HANDLER 1: VOICE INPUT ---
    const handleSpeechInput = useCallback((text) => {
        setVoiceText(text);
    }, []);

    // --- HANDLER 2: TRANSLATION REQUEST ---
    const handleTranslateCommand = (langCode) => {
        setTranslationCommand({ 
            lang: langCode, 
            textToTranslate: editorContent, // Pass the current text
            id: Date.now() // Unique ID to ensure useEffect runs every time
        });
    };

    // --- HANDLER 3: TRANSLITERATION REQUEST ---
    const handleTransliterateCommand = (scriptCode) => {
        setTransliterationCommand({
            script: scriptCode,
            textToTransliterate: editorContent, // Pass the current text
            id: Date.now()
        });
    };
    
    // --- ⚠️ NEW HANDLER 4: FONT CONVERSION REQUEST ---
    const handleFontConvertCommand = (fontCode) => {
        setFontConvertCommand({
            font: fontCode,
            textToConvert: editorContent, // Pass the current text
            id: Date.now()
        });
    };

    // --- HANDLER 5: EDITOR CONTENT UPDATE ---
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
                
                {/* LEFT: Sidebar (The Buttons) */}
                <Sidebar 
                    onSpeechInput={handleSpeechInput} 
                    
                    // Translation Props
                    onTranslate={handleTranslateCommand} 
                    isTranslating={isTranslating} 
                    
                    // Transliteration Props
                    onTransliterate={handleTransliterateCommand} 
                    isTransliterating={isTransliterating}
                    
                    // ⬅️ NEW: Font Conversion Props
                    onFontConvert={handleFontConvertCommand}
                    isConverting={isConverting} 
                />
                
                {/* RIGHT: Editor (The Text Box) */}
                <main className="flex-1 ml-72 flex flex-col relative h-full"> 
                    
                    <Editor 
                        speechText={voiceText} 
                        
                        // Text Content State
                        manualText={editorContent} 
                        setManualText={updateEditorContent} 

                        // Command Triggers
                        translationCommand={translationCommand}
                        transliterationCommand={transliterationCommand}
                        fontConvertCommand={fontConvertCommand} // ⬅️ Trigger Prop

                        // Loading State Setters
                        setIsTranslating={setIsTranslating} 
                        setIsTransliterating={setIsTransliterating} 
                        setIsConverting={setIsConverting} // ⬅️ Loading Setter Prop
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