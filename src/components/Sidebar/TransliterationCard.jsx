import React, { useState } from "react";

const scriptOptions = [
  { code: "en", label: "Roman Script (English letters)" },
  { code: "hi", label: "Devanagari (हिंदी)" },
];

const TransliterationCard = ({ editorText, onTransliterationComplete }) => {
  const [targetScript, setTargetScript] = useState("en");
  const [error, setError] = useState("");
  const [isTransliterating, setIsTransliterating] = useState(false);

  const handleClick = async () => {
    if (!editorText || editorText.trim() === "") {
      setError("⚠️ Please enter text in the editor first.");
      return;
    }
    setError("");
    setIsTransliterating(true);

    try {
      const response = await fetch("http://localhost:5000/api/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editorText,
          sourceLang: "hi",       // adjust if needed
          targetScript: targetScript,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      const data = await response.json();
      if (data.error) {
        setError(`❌ ${data.details || data.error}`);
      } else {
        // ✅ send transliterated text up to Dashboard
        if (onTransliterationComplete) {
          onTransliterationComplete(data.transliteratedText);
        }
      }
    } catch (err) {
      setError(`❌ Transliteration failed: ${err.message}`);
    } finally {
      setIsTransliterating(false);
    }
  };

  return (
    <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-100 shadow-sm">
      <h3 className="text-xs font-bold text-green-500 mb-2 flex items-center gap-2 uppercase">
        ✍️ Transliteration
      </h3>

      <select
        value={targetScript}
        onChange={(e) => setTargetScript(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-green-500 cursor-pointer"
      >
        {scriptOptions.map((s) => (
          <option key={s.code} value={s.code}>{s.label}</option>
        ))}
      </select>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      <button
        onClick={handleClick}
        disabled={isTransliterating}
        className={`w-full py-2 rounded text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 ${
          isTransliterating
            ? "bg-green-300 text-green-700 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {isTransliterating ? "⏳ Transliterating..." : "🔄 Transliterate Script"}
      </button>
    </div>
  );
};

export default TransliterationCard;
