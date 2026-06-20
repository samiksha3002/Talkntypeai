/**
 * FontConvertCard.jsx
 * Sirf 3 options: Unicode → KrutiDev, Unicode → Shivaji, Unicode → Preeti
 * Jo bhi Marathi/Hindi text editor mein hai → selected font mein convert hoga
 */

import React, { useState } from "react";

// Sirf ye 3 options — as requested
const FONT_OPTIONS = [
  { id: "unicode-to-krutidev", label: "KrutiDev" },
  { id: "unicode-to-shivaji",  label: "Shivaji"  },
  { id: "unicode-to-preeti",   label: "Preeti"   },
];

export default function FontConvertCard({ editorText = "", onFontConvert, isConverting }) {
  const [selected, setSelected] = useState("unicode-to-krutidev");
  const [error, setError]       = useState("");

  const handleClick = () => {
    const plain = editorText.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!plain) {
      setError("⚠️ Editor mein pehle kuch text likhiye.");
      return;
    }
    setError("");
    if (typeof onFontConvert === "function") onFontConvert(selected);
  };

  const plainLen = editorText.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim().length;

  return (
    <div style={{
      background: "#f5f3ff", border: "1px solid #ede9fe",
      borderRadius: "10px", padding: "14px 16px", marginBottom: "16px",
    }}>
      <h3 style={{
        fontSize: "11px", fontWeight: "700", color: "#7c3aed",
        textTransform: "uppercase", letterSpacing: "0.07em",
        marginBottom: "12px",
      }}>
        AA  Font Conversion
      </h3>

      <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>
        Conversion type
      </label>
      <select
        value={selected}
        onChange={e => { setSelected(e.target.value); setError(""); }}
        disabled={isConverting}
        style={{
          width: "100%", marginBottom: "10px", fontSize: "13px",
          padding: "7px 8px", borderRadius: "6px",
          border: "1px solid #ddd6fe", background: "#fff",
          cursor: isConverting ? "not-allowed" : "pointer",
        }}
      >
        {FONT_OPTIONS.map(o => (
          <option key={o.id} value={o.id}>Unicode → {o.label}</option>
        ))}
      </select>

      {plainLen > 0 && (
        <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
          {plainLen} chars ready to convert
        </p>
      )}

      {error && (
        <p style={{
          fontSize: "12px", color: "#dc2626", background: "#fef2f2",
          border: "1px solid #fca5a5", borderRadius: "6px",
          padding: "6px 10px", marginBottom: "8px",
        }}>{error}</p>
      )}

      <button
        onClick={handleClick}
        disabled={isConverting}
        style={{
          width: "100%", padding: "9px", fontSize: "13px", fontWeight: "600",
          borderRadius: "7px", border: "none",
          background: isConverting ? "#ddd6fe" : "#7c3aed",
          color: isConverting ? "#7c3aed" : "#fff",
          cursor: isConverting ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        }}
      >
        {isConverting ? "⏳ Converting…" : "⇄ Convert Font"}
      </button>
    </div>
  );
}