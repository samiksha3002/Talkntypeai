import React, { useState } from 'react';

// Language Options for dropdown
const languageOptions = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
];

const TranslationCard = ({ onTranslate, isTranslating, editorText }) => {
  const [targetLang, setTargetLang] = useState('hi');
  const [error, setError] = useState('');

  // 💡 HELPER: Function to clean up language codes (e.g., "mr-IN" -> "mr")
  const getCleanLangCode = (code) => {
    // Splits at '-' and takes the first part, or returns the code itself
    return code ? code.split('-')[0] : '';
  };

  const handleTranslateClick = () => {
    // 1. Client-Side Validation (Prevents 400 Bad Request when text is empty)
    if (!editorText || editorText.trim() === '') {
      setError('⚠️ Please enter some text in the editor before translating.');
      return;
    }
    
    setError('');
    
    // 2. Cleanup Language Code (Ensures API gets a standard code like 'hi', not 'hi-IN')
    const cleanLangCode = getCleanLangCode(targetLang);

    if (onTranslate) {
      // 3. Trigger command with the cleaned code
      onTranslate(cleanLangCode);
    }
  };

  return (
    <div className="bg-indigo-50 rounded-lg p-3 mb-4 border border-indigo-100 shadow-sm">
      <h3 className="text-xs font-bold text-indigo-500 mb-2 flex items-center gap-2 uppercase">
        <span className="bg-white p-1 rounded shadow-sm text-lg">🈯</span> Translation
      </h3>

      <label
        htmlFor="translation-language"
        className="text-[10px] text-gray-500 font-bold mb-1 block"
      >
        CONVERT EDITOR TEXT TO:
      </label>

      {/* Language Selector */}
      <select
        id="translation-language"
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-indigo-500 cursor-pointer"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs mb-2">{error}</p>
      )}

      {/* Translate Button */}
      <button
        onClick={handleTranslateClick}
        disabled={isTranslating}
        className={`w-full py-2 rounded text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 ${
          isTranslating
            ? 'bg-indigo-300 text-indigo-700 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        <span>{isTranslating ? '⏳' : '🔄'}</span>
        {isTranslating ? 'Translating...' : 'Translate Document'}
      </button>
    </div>
  );
};

export default TranslationCard;