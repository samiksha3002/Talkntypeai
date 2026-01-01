import React, { useState } from 'react';

// ✅ Base URL ko alag rakhein taaki debug karna aasaan ho
const BASE_URL = "https://tnt-gi49.onrender.com"; 

const languageOptions = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'kn-IN', label: 'Kannada (कನ್ನಡ)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
];

const TranslationCard = ({ editorText, onTranslationComplete }) => {
  const [targetLang, setTargetLang] = useState('hi');
  const [error, setError] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const getCleanLangCode = (code) => {
    return code ? code.split('-')[0] : '';
  };

  const handleTranslateClick = async () => {
    if (!editorText || editorText.trim() === '') {
      setError('⚠️ Please enter some text in the editor before translating.');
      return;
    }

    setError('');
    setIsTranslating(true);

    const cleanLangCode = getCleanLangCode(targetLang);

    try {
      // ✅ Explicitly using the full path
      const response = await fetch(`${BASE_URL}/api/chattranslate`, {
        method: "POST",
        mode: 'cors', // ✅ CORS mode enable karein
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          text: editorText,
          targetLang: cleanLangCode,
        }),
      });

      if (!response.ok) {
        // Render par kai baar 502/503 error aata hai agar server 'sleep' mode mein ho
        if(response.status === 502) throw new Error("Server is waking up. Please try again in 30 seconds.");
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status})`);
      }

      const data = await response.json();
      
      if (data.error) {
        setError(`❌ ${data.details || data.error}`);
      } else {
        if (onTranslationComplete) {
          onTranslationComplete(data.translatedText);
        }
      }
    } catch (err) {
      // ✅ Agar Render server slow hai toh ye message dikhayega
      setError(`❌ Connection failed. Check if backend is live at Render.`);
      console.error("Fetch Error Details:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="bg-indigo-50 rounded-lg p-3 mb-4 border border-indigo-100 shadow-sm">
      <h3 className="text-xs font-bold text-indigo-500 mb-2 flex items-center gap-2 uppercase">
        <span className="bg-white p-1 rounded shadow-sm text-lg">🈯</span> Translation
      </h3>

      <label htmlFor="translation-language" className="text-[10px] text-gray-500 font-bold mb-1 block">
        CONVERT EDITOR TEXT TO:
      </label>

      <select
        id="translation-language"
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-indigo-500 cursor-pointer"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>

      {error && (
        <div className="bg-red-50 p-2 rounded mb-2">
           <p className="text-red-500 text-[10px]">{error}</p>
        </div>
      )}

      <button
        onClick={handleTranslateClick}
        disabled={isTranslating}
        className={`w-full py-2 rounded text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 ${
          isTranslating ? 'bg-indigo-300 text-indigo-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        <span>{isTranslating ? '⏳' : '🔄'}</span>
        {isTranslating ? 'Processing...' : 'Translate Document'}
      </button>
    </div>
  );
};

export default TranslationCard;