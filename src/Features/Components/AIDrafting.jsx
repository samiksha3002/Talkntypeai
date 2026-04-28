// ==========================================
// PASTE THIS ENTIRE FILE — COMPLETE UPDATED AIDrafting COMPONENT
// Replace your old AIDrafting.jsx with this file
// ==========================================

import React, { useState, useEffect, useRef } from "react";
import {
  Maximize2, ListChecks, Sparkles, Wand2, Scale,
  ChevronLeft, ChevronRight, Gavel, Calendar, ShieldAlert,
  Download, FileText, Printer, Copy, Share2, Stamp,
  CheckCircle2, FileDown, FileType2, ClipboardCopy, X
} from "lucide-react";

// ==========================================
// URL CONFIGURATION (NODE vs PYTHON)
// ==========================================
const NODE_API_URL = "https://talkntypeai.onrender.com";
const PYTHON_API_URL = "https://talkntype-ai-python.onrender.com";

const getApiUrl = (endpoint) => {
  const isLocal = window.location.hostname === "localhost";
  const pythonEndpoints = [
    "/api/generate-legal-draft",
    "/api/generate-legal-draft-stream",
    "/api/ai-command",
    "/api/chat-with-pdf",
    "/api/analyze-document"
  ];
  if (pythonEndpoints.includes(endpoint)) {
    return isLocal ? `http://localhost:8000${endpoint}` : `${PYTHON_API_URL}${endpoint}`;
  }
  return isLocal ? `http://localhost:10000${endpoint}` : `${NODE_API_URL}${endpoint}`;
};

// ==========================================
// DOWNLOAD UTILITIES
// ==========================================

// 1. Print / Save as PDF
const handlePrint = () => window.print();

// 2. Download as plain .txt (fallback if no docx library)
const downloadTxt = (text, filename = "LexScript_Draft.txt") => {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// 3. Download as .doc (RTF-wrapped HTML, opens in Word)
const downloadWord = (htmlContent, filename = "LexScript_Draft.doc") => {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Legal Draft</title>
    <style>
      @page { margin: 2cm; }
      body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 2; color: #000; }
      b { font-weight: bold; }
      p { margin: 0 0 12pt 0; text-align: justify; }
    </style>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>
    <w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
    </head><body>`;
  const footer = `</body></html>`;

  // Convert plain text with **bold** markers to HTML
  const formatted = htmlContent
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br/>");

  const blob = new Blob([header + formatted + footer], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// 4. Copy to clipboard
const copyToClipboard = async (text, onSuccess) => {
  try {
    await navigator.clipboard.writeText(text);
    onSuccess?.();
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    onSuccess?.();
  }
};

// 5. Share (Web Share API or copy link)
const shareDraft = async (text) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Legal Draft – LexScript AI",
        text: text.slice(0, 200) + "...",
        url: window.location.href,
      });
    } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }
};

// ==========================================
// TOAST NOTIFICATION (small, auto-dismiss)
// ==========================================
const Toast = ({ message, onClose }) => (
  <div
    style={{
      position: "fixed",
      bottom: "32px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: "#0f172a",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: "700",
      letterSpacing: "0.5px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      animation: "slideUp 0.3s ease",
    }}
  >
    <CheckCircle2 size={16} color="#4ade80" />
    {message}
  </div>
);

// ==========================================
// DOWNLOAD DROPDOWN MENU
// ==========================================
const DownloadMenu = ({ onClose, rawDraft, liveDraft }) => {
  const actions = [
    {
      icon: <Printer size={16} />,
      label: "Print / Save as PDF",
      sub: "Opens browser print dialog",
      color: "#6366f1",
      bg: "#eef2ff",
      action: () => { handlePrint(); onClose(); },
    },
    {
      icon: <FileType2 size={16} />,
      label: "Download as Word (.doc)",
      sub: "Opens in Microsoft Word",
      color: "#2563eb",
      bg: "#eff6ff",
      action: () => { downloadWord(rawDraft || liveDraft); onClose(); },
    },
    {
      icon: <FileDown size={16} />,
      label: "Download as Text (.txt)",
      sub: "Plain text file",
      color: "#0891b2",
      bg: "#ecfeff",
      action: () => { downloadTxt(rawDraft || liveDraft); onClose(); },
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        zIndex: 999,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        padding: "8px",
        minWidth: "260px",
        animation: "dropIn 0.2s ease",
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={a.action}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "14px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = a.bg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: a.bg, display: "flex", alignItems: "center",
            justifyContent: "center", color: a.color, flexShrink: 0,
          }}>
            {a.icon}
          </span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", letterSpacing: "0.2px" }}>
              {a.label}
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", marginTop: "1px" }}>
              {a.sub}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ==========================================
// STAMP BADGE (Draft / Final / Confidential)
// ==========================================
const StampBadge = ({ status }) => {
  if (!status) return null;
  const config = {
    DRAFT: { color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
    FINAL: { color: "#10b981", bg: "#f0fdf4", border: "#6ee7b7" },
    CONFIDENTIAL: { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5" },
  };
  const c = config[status] || config.DRAFT;
  return (
    <div style={{
      position: "absolute",
      top: "32px",
      right: "32px",
      border: `3px solid ${c.border}`,
      color: c.color,
      background: c.bg,
      padding: "6px 18px",
      borderRadius: "8px",
      fontSize: "20px",
      fontWeight: "900",
      letterSpacing: "4px",
      opacity: 0.6,
      transform: "rotate(-15deg)",
      pointerEvents: "none",
      userSelect: "none",
      fontFamily: "serif",
    }}>
      {status}
    </div>
  );
};

// ==========================================
// FEATURE: BEAUTIFIED EMERALD CASE METER
// ==========================================
const CaseMeter = ({ score }) => {
  const displayScore = score || 75;
  return (
    <div className="mb-8 p-6 bg-white rounded-[32px] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden group animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[3px] text-emerald-600 block mb-1">Success Probability</span>
          <h3 className="text-4xl font-black text-slate-900 leading-none">
            {displayScore}<span className="text-lg text-emerald-500">%</span>
          </h3>
        </div>
        <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600">
          <Scale size={24} />
        </div>
      </div>
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[2px]">
        <div
          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          style={{ width: `${displayScore}%` }}
        ></div>
      </div>
      <p className="mt-3 text-[10px] text-slate-400 font-bold italic uppercase tracking-wider text-center">
        Strong Legal Grounds Detected
      </p>
    </div>
  );
};

// ==========================================
// STREAMING CURSOR BLINK
// ==========================================
const StreamingCursor = () => (
  <span
    style={{
      display: "inline-block",
      width: "2px",
      height: "1.2em",
      backgroundColor: "#4f46e5",
      marginLeft: "2px",
      verticalAlign: "text-bottom",
      animation: "blink 1s step-end infinite",
    }}
  />
);

// ==========================================
// MAIN COMPONENT
// ==========================================
const AIDrafting = ({ onBack, setManualText, setIsAIGenerating }) => {
  const [step, setStep] = useState(1);
  const [caseFacts, setCaseFacts] = useState("");
  const [language, setLanguage] = useState("English");

  const [streamedText, setStreamedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [rawDraft, setRawDraft] = useState("");
  const [liveDraft, setLiveDraft] = useState("");

  const [file, setFile] = useState(null);

  const [selectedText, setSelectedText] = useState("");
  const [menuPos, setMenuPos] = useState({ x: 0, top: 0 });
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [localIsGenerating, setLocalIsGenerating] = useState(false);

  const [intelligence, setIntelligence] = useState({
    judgments: "Awaiting generation...",
    arguments: "Awaiting generation...",
    timeline: "Awaiting chronology data...",
    strategy: null,
  });

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ===== NEW STATES =====
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [stampStatus, setStampStatus] = useState(null); // null | 'DRAFT' | 'FINAL' | 'CONFIDENTIAL'
  const [showStampMenu, setShowStampMenu] = useState(false);
  const downloadBtnRef = useRef(null);
  const stampBtnRef = useRef(null);
  // ======================

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [variables, setVariables] = useState({
    "{name_of_applicant}": "",
    "{father_name_of_applicant}": "",
    "{age_of_applicant}": "",
    "{address_of_applicant}": "",
    "{police_station_name}": "",
    "{bail_application_number}": "",
    "{year}": new Date().getFullYear().toString(),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadBtnRef.current && !downloadBtnRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
      if (stampBtnRef.current && !stampBtnRef.current.contains(e.target)) {
        setShowStampMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // SMART SYNC: rawDraft + variables → liveDraft
  // ==========================================
  useEffect(() => {
    if (!rawDraft) return;
    const placeholderPattern = /\[([^\]]+)\]/g;
    const updated = rawDraft.replace(placeholderPattern, (match, content) => {
      const lower = content.toLowerCase();
      if (lower.includes("name") && (lower.includes("applicant") || lower.includes("accused")))
        return variables["{name_of_applicant}"] || match;
      if (lower.includes("father") || lower.includes("parent"))
        return variables["{father_name_of_applicant}"] || match;
      if (lower.includes("address"))
        return variables["{address_of_applicant}"] || match;
      if (lower.includes("police station"))
        return variables["{police_station_name}"] || match;
      if (lower.includes("number") || lower.includes("xxxx"))
        return variables["{bail_application_number}"] || match;
      if (lower.includes("year"))
        return variables["{year}"] || match;
      return match;
    });
    setLiveDraft(updated);
  }, [rawDraft, variables]);

  // ==========================================
  // BOLD / JUDGMENT RENDERING
  // ==========================================
  const renderFormattedDraft = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanText = part.replace(/\*\*/g, "");
        const isJudgment =
          cleanText.toLowerCase().includes("vs") ||
          cleanText.toLowerCase().includes(" v ");
        return (
          <b
            key={i}
            onClick={() =>
              isJudgment &&
              window.open(
                `https://indiankanoon.org/search/?q=${encodeURIComponent(cleanText)}`,
                "_blank"
              )
            }
            className={`font-bold text-slate-900 ${isJudgment
              ? "cursor-pointer hover:text-indigo-600 hover:underline decoration-indigo-300"
              : ""
            }`}
          >
            {cleanText}
          </b>
        );
      }
      return part;
    });
  };

  // ==========================================
  // TEXT SELECTION & AI COMMANDS
  // ==========================================
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && step === 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setMenuPos({ x: rect.left, top: rect.top + window.scrollY - 60 });
    } else {
      setSelectedText("");
    }
  };

  const applyAICommand = async (command) => {
    if (!selectedText) return;
    setLocalIsGenerating(true);
    try {
      const response = await fetch(getApiUrl("/api/ai-command"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, text: selectedText, context: caseFacts }),
      });
      const data = await response.json();
      if (data.success) {
        setRawDraft((prev) => prev.replace(selectedText, data.newText));
        setSelectedText("");
      }
    } catch {
      alert("Command failed. Check server connection.");
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const onFileSelect = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setStep(2);
    }
  };

  // ==========================================
  // PARSE SECTIONS FROM FULL STREAMED TEXT
  // ==========================================
  const parseDraftSections = (fullText) => {
    const getSection = (text, start, end) => {
      const escapedStart = start.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
      const escapedEnd = end.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
      const match = text.match(new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`));
      return match ? match[1].trim() : "";
    };

    const draft = getSection(fullText, "---DRAFT---", "---AFFIDAVIT---");
    const affidavit = getSection(fullText, "---AFFIDAVIT---", "---JUDGMENTS---");
    const judgments = getSection(fullText, "---JUDGMENTS---", "---ARGUMENTS---");
    const argumentsText = getSection(fullText, "---ARGUMENTS---", "---STRATEGY---");
    const strategy = getSection(fullText, "---STRATEGY---", "---TIMELINE---");
    const timeline = fullText.split("---TIMELINE---").pop()?.trim() || "";

    const mainDraft = draft || fullText;
    const fullDraft = affidavit ? `${mainDraft}\n\n---\n\n${affidavit}` : mainDraft;

    setRawDraft(fullDraft);
    setIntelligence({
      judgments: judgments || "No specific cases found.",
      arguments: argumentsText || "Preparing strategy...",
      timeline: timeline || "Timeline not available.",
      strategy: {
        win_probability: parseInt(strategy?.match(/\d+/)?.[0]) || 75,
        opponent_args: strategy || "Analyzing defense...",
      },
    });
  };

  // ==========================================
  // STREAMING GENERATION
  // ==========================================
  const generateDraftWithStreaming = async (facts, lang, documentType, uploadedFile) => {
    setStreamedText("");
    setRawDraft("");
    setLiveDraft("");
    setIsGenerating(true);
    setLocalIsGenerating(true);

    try {
      let response;

      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("facts", facts || "Generate draft from this document");
        formData.append("language", lang);
        if (documentType) formData.append("documentType", documentType);
        response = await fetch(getApiUrl("/api/generate-legal-draft-stream"), {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(getApiUrl("/api/generate-legal-draft-stream"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts, language: lang, documentType: documentType || null }),
        });
      }

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);

          if (data === "[DONE]") {
            parseDraftSections(fullText);
            setStreamedText("");
            setStep(3);
            setIsGenerating(false);
            setLocalIsGenerating(false);
            return;
          }

          if (data.startsWith("[ERROR]")) {
            console.error("Stream error:", data);
            setIsGenerating(false);
            setLocalIsGenerating(false);
            alert("Draft generation error. Please try again.");
            return;
          }

          const token = data.replace(/\\n/g, "\n");
          fullText += token;
          setStreamedText(fullText);
        }
      }

      if (fullText) {
        parseDraftSections(fullText);
        setStreamedText("");
        setStep(3);
      }
    } catch (error) {
      console.error("Streaming error:", error);
      alert("Backend connection failed! Ensure your Python server is running.");
    } finally {
      setIsGenerating(false);
      setLocalIsGenerating(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!caseFacts.trim() && !file) {
      return alert("Please enter instructions or upload a PDF to proceed.");
    }
    await generateDraftWithStreaming(caseFacts, language, null, file);
  };

  // ==========================================
  // CHAT SUBMIT
  // ==========================================
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/chat-with-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, context: caseFacts, history: chatHistory }),
      });
      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Brain offline." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ==========================================
  // SPINNER OVERLAY
  // ==========================================
  const SpinnerOverlay = () => (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <Sparkles
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse"
          size={40}
        />
      </div>
      <h2 className="mt-8 text-2xl font-black text-slate-800 tracking-tight">
        LexScript AI is Drafting...
      </h2>
      <p className="mt-2 text-slate-500 italic tracking-wide">
        Streaming your petition word by word...
      </p>
      {streamedText && (
        <div className="mt-6 max-w-2xl w-full mx-4 bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-xl max-h-48 overflow-y-auto">
          <p className="text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
            {streamedText.slice(-600)}
            <StreamingCursor />
          </p>
        </div>
      )}
    </div>
  );

  // ==========================================
  // STEP 1: START MODAL
  // ==========================================
  if (step === 1)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-3xl w-full mx-4 text-center relative animate-scale-up">
          <button
            onClick={onBack}
            className="absolute top-8 right-10 text-slate-300 hover:text-slate-600 text-3xl transition-colors"
          >
            ✕
          </button>
          <h2 className="text-4xl font-black mb-12 text-slate-900 tracking-tight">
            Start Drafting
          </h2>
          <div className="grid grid-cols-2 gap-10">
            <div
              onClick={() => setStep(2)}
              className="group border-2 border-dashed p-12 rounded-[40px] cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">✍️</div>
              <h3 className="font-black text-xl text-slate-800">Type Facts</h3>
            </div>
            <div
              onClick={() => fileInputRef.current.click()}
              className="group border-2 border-dashed p-12 rounded-[40px] cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📤</div>
              <h3 className="font-black text-xl text-slate-800">Upload PDF</h3>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileSelect}
                accept=".pdf"
              />
            </div>
          </div>
        </div>
      </div>
    );

  // ==========================================
  // STEP 2: FACTS INPUT
  // ==========================================
  if (step === 2)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        {localIsGenerating && <SpinnerOverlay />}
        <div className="bg-white p-10 rounded-[40px] max-w-3xl w-full shadow-2xl">
          <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-900">
            <Scale className="text-indigo-600" /> Case Facts
          </h2>

          {file && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top duration-300">
              <FileText className="text-emerald-600" size={18} />
              <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[200px]">
                Attached: {file.name}
              </span>
              <button
                onClick={() => setFile(null)}
                className="ml-auto text-emerald-400 hover:text-emerald-600 p-1 transition-colors"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}

          <textarea
            className="w-full h-72 p-8 bg-slate-50 border border-slate-200 rounded-[32px] outline-none focus:border-indigo-500 text-lg leading-relaxed text-slate-700"
            value={caseFacts}
            onChange={(e) => setCaseFacts(e.target.value)}
            placeholder="Type your case story here (FIR No, Date of Marriage, etc.)..."
          />

          <div className="mt-10 flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="font-bold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <div className="flex gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-100 px-6 py-4 rounded-2xl font-black text-sm outline-none"
              >
                <option value="English">English</option>
                <option value="Marathi">Marathi</option>
                <option value="Hindi">Hindi</option>
                <option value="Gujarati">Gujarati</option>
              </select>
              <button
                onClick={handleGenerateDraft}
                disabled={localIsGenerating}
                className="px-12 py-4 bg-indigo-600 text-white rounded-[20px] font-black shadow-xl shadow-indigo-100 transition-all transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {localIsGenerating ? "Generating..." : "Generate Draft"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // ==========================================
  // STEP 3: FULL EDITOR VIEW
  // ==========================================
  return (
    <>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        @media print {
          nav, .h-16, .w-72, .bg-white.border-l, button, .fixed, .z-20, .no-print {
            display: none !important;
          }
          .flex-1 {
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .max-w-\\[850px\\] {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
          }
          body { background: white !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 14px;
          border: none;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .action-btn:active { transform: scale(0.96); }

        .stamp-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 999;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          padding: 8px;
          min-width: 200px;
          animation: dropIn 0.2s ease;
        }
        .stamp-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          transition: background 0.15s;
          text-align: left;
        }
      `}</style>

      <div className="flex flex-col h-full bg-slate-100 overflow-hidden animate-fade-in font-sans">
        {localIsGenerating && <SpinnerOverlay />}

        {/* ================================================ */}
        {/* ✅ UPDATED HEADER WITH ALL ACTION BUTTONS         */}
        {/* ================================================ */}
        <div className="h-16 bg-white border-b flex items-center px-6 justify-between shrink-0 shadow-sm z-20 no-print">
          {/* LEFT: Back */}
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 text-slate-500 font-black text-sm hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={20} /> Back to Facts
          </button>

          {/* CENTER: Engine Badge + Streaming Indicator */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 hidden md:block">
              LexScript 2.0 Engine
            </span>
            {isGenerating && (
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-ping" />
                Streaming...
              </span>
            )}
          </div>

          {/* RIGHT: Action Buttons */}
          <div className="flex items-center gap-2">

            {/* 1. COPY TEXT */}
            <button
              className="action-btn no-print"
              style={{ background: "#f8fafc", color: "#475569" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
              onClick={() =>
                copyToClipboard(liveDraft || rawDraft, () =>
                  setToast("Draft copied to clipboard!")
                )
              }
              title="Copy draft text to clipboard"
            >
              <ClipboardCopy size={15} />
              <span className="hidden lg:inline">Copy Text</span>
            </button>

            {/* 2. SHARE */}
            <button
              className="action-btn no-print"
              style={{ background: "#f8fafc", color: "#475569" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
              onClick={() => shareDraft(liveDraft || rawDraft)}
              title="Share this draft"
            >
              <Share2 size={15} />
              <span className="hidden lg:inline">Share</span>
            </button>

            {/* 3. STAMP (Draft / Final / Confidential) */}
            <div style={{ position: "relative" }} ref={stampBtnRef}>
              <button
                className="action-btn no-print"
                style={{
                  background: stampStatus ? "#fef9c3" : "#f8fafc",
                  color: stampStatus ? "#92400e" : "#475569",
                  border: stampStatus ? "1.5px solid #fcd34d" : "none",
                }}
                onMouseEnter={e => { if (!stampStatus) e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={e => { if (!stampStatus) e.currentTarget.style.background = "#f8fafc"; }}
                onClick={() => setShowStampMenu(v => !v)}
                title="Stamp document status"
              >
                <Stamp size={15} />
                <span className="hidden lg:inline">
                  {stampStatus ? stampStatus : "Stamp"}
                </span>
              </button>

              {showStampMenu && (
                <div className="stamp-menu">
                  {[
                    { label: "DRAFT", color: "#b45309", bg: "#fef3c7" },
                    { label: "FINAL", color: "#065f46", bg: "#d1fae5" },
                    { label: "CONFIDENTIAL", color: "#991b1b", bg: "#fee2e2" },
                    { label: "Remove Stamp", color: "#64748b", bg: "#f8fafc" },
                  ].map(({ label, color, bg }) => (
                    <button
                      key={label}
                      className="stamp-option"
                      style={{ color }}
                      onMouseEnter={e => e.currentTarget.style.background = bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => {
                        setStampStatus(label === "Remove Stamp" ? null : label);
                        setShowStampMenu(false);
                        if (label !== "Remove Stamp") setToast(`Stamped as ${label}`);
                      }}
                    >
                      <span style={{
                        width: "10px", height: "10px", borderRadius: "2px",
                        background: color, display: "inline-block", flexShrink: 0,
                      }} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. DOWNLOAD DROPDOWN (PDF / Word / TXT) */}
            <div style={{ position: "relative" }} ref={downloadBtnRef}>
              <button
                className="action-btn no-print"
                style={{ background: "#eff6ff", color: "#1d4ed8" }}
                onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                onClick={() => setShowDownloadMenu(v => !v)}
                title="Download options"
              >
                <FileDown size={15} />
                <span>Download</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>▾</span>
              </button>

              {showDownloadMenu && (
                <DownloadMenu
                  onClose={() => setShowDownloadMenu(false)}
                  rawDraft={rawDraft}
                  liveDraft={liveDraft}
                />
              )}
            </div>

            {/* 5. PRINT COURT BUNDLE (primary CTA) */}
            <button
              className="action-btn no-print"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.92"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              onClick={handlePrint}
              title="Print full court bundle"
            >
              <Printer size={15} />
              Print Court Bundle
            </button>
          </div>
        </div>
        {/* ================================================ */}
        {/* END OF UPDATED HEADER                            */}
        {/* ================================================ */}

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: VARIABLES PANEL */}
          <div className="w-72 bg-white border-r p-8 overflow-y-auto shrink-0 shadow-inner custom-scrollbar">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Wand2 size={14} /> Party Data
            </h3>
            <div className="space-y-6">
              {Object.keys(variables).map((key) => (
                <div key={key}>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 transition-colors hover:text-indigo-600">
                    {key.replace(/[{}]/g, "").replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={variables[key]}
                    onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                    placeholder="Enter value..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: EDITABLE CANVAS */}
          <div
            className="flex-1 bg-slate-200/50 overflow-y-auto p-12 relative custom-scrollbar"
            onMouseUp={handleTextSelection}
          >
            {/* Floating AI Command Menu */}
            {selectedText && !isGenerating && (
              <div
                className="fixed bg-white shadow-2xl rounded-2xl border border-slate-100 p-1.5 flex gap-1.5 z-[200] animate-in fade-in zoom-in duration-200"
                style={{ left: menuPos.x, top: menuPos.top }}
              >
                <button
                  onClick={() => applyAICommand("Expand Ground")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Maximize2 size={14} /> Expand
                </button>
                <button
                  onClick={() => applyAICommand("Make Professional")}
                  className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Scale size={14} /> Legalize
                </button>
              </div>
            )}

            <div className="w-full max-w-[850px] mx-auto bg-white shadow-2xl min-h-[1200px] p-24 border border-slate-100 relative mb-20 ring-1 ring-slate-200">

              {/* STAMP BADGE on document */}
              <StampBadge status={stampStatus} />

              {/* STREAMING VIEW */}
              {isGenerating ? (
                <div className="outline-none whitespace-pre-wrap font-serif text-[17px] leading-[2.2] text-slate-800 text-justify">
                  {streamedText || (
                    <div className="flex flex-col items-center justify-center h-[500px]">
                      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-400 font-bold italic">
                        Connecting to LexScript AI...
                      </p>
                    </div>
                  )}
                  {streamedText && <StreamingCursor />}
                </div>
              ) : (
                /* FINAL EDITABLE VIEW */
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setRawDraft(e.target.innerText)}
                  className="outline-none whitespace-pre-wrap font-serif text-[17px] leading-[2.2] text-slate-800 text-justify selection:bg-indigo-100"
                >
                  {!liveDraft ? (
                    <div className="flex flex-col items-center justify-center h-[500px]">
                      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-400 font-bold italic">
                        Drafting your detailed petition bundle...
                      </p>
                    </div>
                  ) : (
                    renderFormattedDraft(liveDraft)
                  )}
                </div>
              )}

              <div className="mt-24 text-center text-[10px] text-slate-300 border-t pt-12 uppercase tracking-[6px] font-black italic">
                Authenticated by TNT NextGen Legal AI
              </div>
            </div>
          </div>

          {/* RIGHT: INTELLIGENCE HUB */}
          <div
            style={{ width: `${rightPanelWidth}px` }}
            className="bg-white border-l p-8 overflow-y-auto shrink-0 flex flex-col relative transition-all duration-300 shadow-2xl z-10 custom-scrollbar"
          >
            <button
              onClick={() => setRightPanelWidth(rightPanelWidth === 350 ? 550 : 350)}
              className="absolute left-[-15px] top-1/2 bg-white border border-slate-200 w-8 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-lg z-50"
            >
              {rightPanelWidth === 350 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <CaseMeter score={intelligence.strategy?.win_probability} />

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 border-b pb-4 flex items-center gap-2">
              <Sparkles size={14} /> Legal Intelligence
            </h3>

            {/* Landmark Judgments */}
            <div className="p-6 rounded-3xl border border-emerald-100 bg-emerald-50/30 mb-4">
              <h4 className="font-black text-emerald-800 text-[10px] mb-4 uppercase flex items-center gap-2">
                <Gavel size={14} /> Landmark Judgments
              </h4>
              <div className="text-slate-700 text-[12px] leading-relaxed italic">
                {isGenerating ? (
                  <span className="text-emerald-400 animate-pulse text-[11px] font-bold">Researching case law...</span>
                ) : (
                  renderFormattedDraft(intelligence.judgments)
                )}
              </div>
            </div>

            {/* Winning Arguments */}
            <div className="p-6 rounded-3xl border border-indigo-100 bg-indigo-50/30 mb-4">
              <h4 className="font-black text-indigo-800 text-[10px] mb-4 uppercase flex items-center gap-2">
                <ListChecks size={14} /> Winning Arguments
              </h4>
              <div className="text-slate-700 text-[12px] leading-relaxed italic">
                {isGenerating ? (
                  <span className="text-indigo-400 animate-pulse text-[11px] font-bold">Building arguments...</span>
                ) : (
                  renderFormattedDraft(intelligence.arguments)
                )}
              </div>
            </div>

            {/* Case Timeline */}
            <div className="p-6 rounded-3xl border border-blue-100 bg-blue-50/30 mb-4">
              <h4 className="font-black text-blue-800 text-[10px] mb-4 uppercase flex items-center gap-2">
                <Calendar size={14} /> Case Timeline
              </h4>
              <div className="text-slate-700 text-[11px] font-mono leading-relaxed whitespace-pre-wrap">
                {isGenerating ? (
                  <span className="text-blue-400 animate-pulse text-[11px] font-bold">Mapping chronology...</span>
                ) : (
                  renderFormattedDraft(intelligence.timeline)
                )}
              </div>
            </div>

            {/* Opponent Strategy */}
            <div className="space-y-6">
              <div className="p-6 rounded-[32px] border border-rose-100 bg-rose-50/30 hover:bg-rose-50/50 transition-all shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <ShieldAlert size={16} />
                  </div>
                  <h4 className="font-black text-rose-900 text-[11px] uppercase tracking-wider">
                    Opponent Strategy
                  </h4>
                </div>
                <div className="text-slate-700 text-[12px] leading-[1.8] font-medium italic">
                  {isGenerating ? (
                    <div className="flex flex-col items-center py-4 gap-2">
                      <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] uppercase font-black text-rose-300 tracking-widest">Analyzing Defense...</p>
                    </div>
                  ) : intelligence.strategy?.opponent_args ? (
                    <div className="space-y-3">
                      {intelligence.strategy.opponent_args.split("\n").filter(Boolean).map((point, idx) => (
                        <p key={idx} className="flex gap-2">
                          <span className="text-rose-500 font-bold">•</span>
                          {point.replace(/^- /, "")}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 gap-2">
                      <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] uppercase font-black text-rose-300 tracking-widest">Analyzing Defense...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Analysis Chat Bot */}
              <div className="mt-8 border border-slate-100 rounded-[32px] overflow-hidden bg-white shadow-xl flex flex-col h-[350px]">
                <div className="bg-slate-900 p-5 text-white text-[11px] font-black uppercase flex items-center gap-2">
                  <Sparkles size={14} /> Case Analysis Bot
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`${
                        msg.role === "user"
                          ? "ml-auto bg-indigo-600 text-white rounded-br-none"
                          : "mr-auto bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm"
                      } p-3.5 rounded-2xl max-w-[90%] text-[11px] leading-relaxed shadow-sm`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-[10px] text-slate-400 font-bold italic animate-pulse">
                      Researching...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI..."
                    className="flex-1 text-[11px] outline-none px-4 py-2.5 bg-slate-50 rounded-xl"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center"
                  >
                    ➔
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
};

export default AIDrafting;
