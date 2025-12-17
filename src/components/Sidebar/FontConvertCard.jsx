import React, { useState } from "react";

const fontOptions = [
  { code: "unicode", label: "Convert to Unicode (Devanagari)" },
  { code: "krutidev", label: "Convert to KrutiDev" },
];

const FontConvertCard = ({ onFontConvert, isConverting, editorText }) => {
  const [targetFont, setTargetFont] = useState("unicode");
  const [error, setError] = useState("");

  const handleClick = () => {
  if (!editorText || editorText.trim() === "") {
    setError("⚠️ Please enter text in the editor first.");
    return;
  }
  setError("");

  if (onFontConvert) {
    onFontConvert(targetFont); // ✅ send lowercase code
  }
};

  return (
    <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-100 shadow-sm">
      <h3 className="text-xs font-bold text-purple-500 mb-2 flex items-center gap-2 uppercase">
        🅰️ Font Conversion
      </h3>

      <select
        value={targetFont}
        onChange={(e) => setTargetFont(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-purple-500 cursor-pointer"
      >
        {fontOptions.map((f) => (
          <option key={f.code} value={f.code}>{f.label}</option>
        ))}
      </select>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      <button
        onClick={handleClick}
        disabled={isConverting}
        className={`w-full py-2 rounded text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 ${
          isConverting ? "bg-purple-300 text-purple-700 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {isConverting ? "⏳ Converting..." : "🔄 Convert Font"}
      </button>
    </div>
  );
};

export default FontConvertCard;