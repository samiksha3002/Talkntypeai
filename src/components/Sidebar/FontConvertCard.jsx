/**
 * FontConvertCard.jsx
 * ─────────────────────────────────────────────────────────────────
 * Props:
 *   editorText   : string   — current text in the editor
 *   onConverted  : (result: string) => void  — called with converted text
 *   apiBase      : string   — base URL for API (default: "/api/font")
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from "react";

const CONVERSION_OPTIONS = [
  { id: "krutidev-to-unicode", label: "KrutiDev → Unicode (Devanagari)", group: "To Unicode" },
  { id: "shivaji-to-unicode",  label: "Shivaji → Unicode (Devanagari)",  group: "To Unicode" },
  { id: "preeti-to-unicode",   label: "Preeti → Unicode (Devanagari)",   group: "To Unicode" },
  { id: "mangal-to-unicode",   label: "Mangal → Unicode (Devanagari)",   group: "To Unicode" },
  { id: "unicode-to-krutidev", label: "Unicode → KrutiDev",              group: "From Unicode" },
  { id: "mangal-to-krutidev",  label: "Mangal → KrutiDev",               group: "From Unicode" },
];

// Group options for the <select>
const GROUPED_OPTIONS = CONVERSION_OPTIONS.reduce((acc, opt) => {
  if (!acc[opt.group]) acc[opt.group] = [];
  acc[opt.group].push(opt);
  return acc;
}, {});

export default function FontConvertCard({
  editorText = "",
  onConverted,
  apiBase = "/api/font",
}) {
  const [conversionType, setConversionType] = useState("krutidev-to-unicode");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(null); // chars in last result

  const handleConvert = useCallback(async () => {
    // Client-side guard
    if (!editorText || editorText.trim() === "") {
      setStatus("error");
      setErrorMsg("Enter some text in the editor before converting.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setCharCount(null);

    try {
      const response = await fetch(`${apiBase}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editorText, conversionType }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Surface the server's error message when available
        throw new Error(
          data.error ||
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      setStatus("success");
      setCharCount(data.convertedText.length);

      if (typeof onConverted === "function") {
        onConverted(data.convertedText);
      }
    } catch (err) {
      setStatus("error");

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setErrorMsg(
          "Cannot reach the server. Check your connection or API URL."
        );
      } else {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    }
  }, [editorText, conversionType, apiBase, onConverted]);

  const handleSelectChange = (e) => {
    setConversionType(e.target.value);
    // Reset feedback when user picks a different conversion
    setStatus("idle");
    setErrorMsg("");
    setCharCount(null);
  };

  /* ---- Derived UI state ---- */
  const isLoading = status === "loading";
  const selectedLabel =
    CONVERSION_OPTIONS.find((o) => o.id === conversionType)?.label ?? "";

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "14px 16px",
        marginBottom: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "var(--color-background-secondary)",
            fontSize: "13px",
          }}
          aria-hidden="true"
        >
          Aa
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Font conversion
        </span>
      </div>

      {/* Conversion selector */}
      <label
        htmlFor="font-conversion-select"
        style={{
          display: "block",
          fontSize: "12px",
          color: "var(--color-text-secondary)",
          marginBottom: "6px",
        }}
      >
        Conversion type
      </label>
      <select
        id="font-conversion-select"
        value={conversionType}
        onChange={handleSelectChange}
        disabled={isLoading}
        style={{
          width: "100%",
          marginBottom: "12px",
          fontSize: "13px",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.6 : 1,
        }}
        aria-label="Select conversion type"
      >
        {Object.entries(GROUPED_OPTIONS).map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Inline text preview (shows what will be converted) */}
      {editorText && editorText.trim().length > 0 && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--color-text-tertiary)",
            marginBottom: "10px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={editorText}
        >
          {editorText.length} char{editorText.length !== 1 ? "s" : ""} ready to
          convert
        </p>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          role="alert"
          style={{
            background: "var(--color-background-danger)",
            border: "0.5px solid var(--color-border-danger)",
            borderRadius: "var(--border-radius-md)",
            padding: "8px 12px",
            marginBottom: "10px",
            fontSize: "12px",
            color: "var(--color-text-danger)",
            display: "flex",
            gap: "6px",
            alignItems: "flex-start",
          }}
        >
          <span aria-hidden="true">⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success state */}
      {status === "success" && charCount !== null && (
        <div
          role="status"
          style={{
            background: "var(--color-background-success)",
            border: "0.5px solid var(--color-border-success)",
            borderRadius: "var(--border-radius-md)",
            padding: "8px 12px",
            marginBottom: "10px",
            fontSize: "12px",
            color: "var(--color-text-success)",
            display: "flex",
            gap: "6px",
            alignItems: "center",
          }}
        >
          <span aria-hidden="true">✓</span>
          <span>
            Converted — {charCount} char{charCount !== 1 ? "s" : ""} in result
          </span>
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={isLoading}
        aria-busy={isLoading}
        aria-label={`Convert using ${selectedLabel}`}
        style={{
          width: "100%",
          padding: "9px 0",
          fontSize: "13px",
          fontWeight: "500",
          cursor: isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          background: isLoading
            ? "var(--color-background-secondary)"
            : "var(--color-background-primary)",
          color: isLoading
            ? "var(--color-text-secondary)"
            : "var(--color-text-primary)",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          transition: "background 120ms, opacity 120ms",
        }}
      >
        {isLoading ? (
          <>
            <Spinner />
            Converting…
          </>
        ) : (
          <>
            <span aria-hidden="true">⇄</span>
            Convert
          </>
        )}
      </button>
    </div>
  );
}

/* ---- Minimal CSS-animation spinner --------------------------------- */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "12px",
        height: "12px",
        border: "2px solid var(--color-border-secondary)",
        borderTop: "2px solid var(--color-text-secondary)",
        borderRadius: "50%",
        animation: "font-card-spin 0.6s linear infinite",
      }}
    />
  );
}

/* Inject keyframes once into the document */
if (typeof document !== "undefined") {
  const styleId = "__font-card-spin__";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      "@keyframes font-card-spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
  }
}