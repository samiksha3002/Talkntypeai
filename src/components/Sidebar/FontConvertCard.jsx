/**
 * FontConvertCard.jsx — FIXED
 * ─────────────────────────────────────────────────────────────────
 * KEY FIX: onFontConvert now passes the conversionType ID directly.
 * Editor.js reads fontConvertCommand.font and sends it to /api/font/convert.
 *
 * Props:
 *   editorText     : string  — HTML or plain text from the editor
 *   onFontConvert  : (conversionType: string) => void
 *                    ← called with e.g. "unicode-to-krutidev"
 *                    ← Editor.js puts this in fontConvertCommand.font
 *   isConverting   : boolean — from parent's isConverting state
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";

const CONVERSION_OPTIONS = [
  // From Unicode (Marathi/Hindi text in editor → legacy font)
  { id: "unicode-to-krutidev", label: "Unicode → KrutiDev",   group: "From Unicode" },
  { id: "unicode-to-shivaji",  label: "Unicode → Shivaji",    group: "From Unicode" },
  { id: "mangal-to-krutidev",  label: "Mangal → KrutiDev",    group: "From Unicode" },
  // To Unicode (legacy font text in editor → Unicode Devanagari)
  { id: "krutidev-to-unicode", label: "KrutiDev → Unicode",   group: "To Unicode" },
  { id: "shivaji-to-unicode",  label: "Shivaji → Unicode",    group: "To Unicode" },
  { id: "preeti-to-unicode",   label: "Preeti → Unicode",     group: "To Unicode" },
  { id: "mangal-to-unicode",   label: "Mangal → Unicode",     group: "To Unicode" },
];

const GROUPED = CONVERSION_OPTIONS.reduce((acc, opt) => {
  if (!acc[opt.group]) acc[opt.group] = [];
  acc[opt.group].push(opt);
  return acc;
}, {});

export default function FontConvertCard({ editorText = "", onFontConvert, isConverting }) {
  const [conversionType, setConversionType] = useState("unicode-to-krutidev");
  const [error, setError] = useState("");

  const handleClick = () => {
    // Strip HTML to get plain text for length check
    const plain = editorText
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (!plain) {
      setError("⚠️ Editor mein pehle kuch text likhiye.");
      return;
    }
    setError("");

    // Pass conversionType string to parent → goes into fontConvertCommand.font
    // Editor.js sends this directly to /api/font/convert as conversionType
    if (typeof onFontConvert === "function") {
      onFontConvert(conversionType);
    }
  };

  return (
    <div
      style={{
        background: "#f9f5ff",
        border: "1px solid #ede9fe",
        borderRadius: "10px",
        padding: "14px 16px",
        marginBottom: "16px",
      }}
    >
      {/* Header */}
      <h3 style={{
        fontSize: "11px", fontWeight: "700", color: "#7c3aed",
        textTransform: "uppercase", letterSpacing: "0.07em",
        marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px",
      }}>
        <span>Aa</span> Font Conversion
      </h3>

      {/* Dropdown */}
      <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>
        Conversion type
      </label>
      <select
        value={conversionType}
        onChange={(e) => { setConversionType(e.target.value); setError(""); }}
        disabled={isConverting}
        style={{
          width: "100%", marginBottom: "10px", fontSize: "13px",
          padding: "7px 8px", borderRadius: "6px",
          border: "1px solid #ddd6fe", background: "#fff",
          cursor: isConverting ? "not-allowed" : "pointer",
        }}
      >
        {Object.entries(GROUPED).map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>

      {/* Char count */}
      {editorText.replace(/<[^>]+>/g,"").trim().length > 0 && (
        <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
          {editorText.replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").trim().length} chars ready to convert
        </p>
      )}

      {/* Error */}
      {error && (
        <p style={{
          fontSize: "12px", color: "#dc2626", background: "#fef2f2",
          border: "1px solid #fca5a5", borderRadius: "6px",
          padding: "6px 10px", marginBottom: "8px",
        }}>
          {error}
        </p>
      )}

      {/* Button */}
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