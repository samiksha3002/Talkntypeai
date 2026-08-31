// src/components/AiChat.jsx
import React, { useEffect, useRef, useState } from "react";

/* ---------- Small inline icons (no external icon package required) ---------- */

function ScaleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M5 7 2 13a3 3 0 0 0 6 0L5 7Z" />
      <path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
      <path d="M8 21h8" />
    </svg>
  );
}

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function ExpandIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function CollapseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3H3v6" />
      <path d="M15 21h6v-6" />
      <path d="M3 3l7 7" />
      <path d="M21 21l-7-7" />
    </svg>
  );
}

function AlertIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

function InfoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/* ------------------------------------------------------------------------- */

// Hardcoded on purpose: this is the version that is confirmed working.
// If this project is set up with Vite, you can swap it for:
//   const API_URL = import.meta.env.VITE_API_URL || "https://talkntypeai.onrender.com/api/chat";
// but `import.meta.env` will throw a build error on non-Vite setups (e.g. CRA/webpack),
// which is the most likely reason the Copilot version was failing.
const API_URL = "https://talkntypeai.onrender.com/api/chat";

const timeNow = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const welcomeMessage = () => ({
  id: "welcome",
  role: "assistant",
  content: `Hello Advocate. I am TNT AI, your legal research and drafting assistant for Indian law. You can ask a legal query, discuss a matter, or request a draft — for example, "Draft a bail application".`,
  time: timeNow(),
});

export default function AiChat({ contextText }) {
  const [messages, setMessages] = useState([welcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => setInput(e.target.value);

  const handleKeyDown = (e) => {
    // Enter sends the message, Shift+Enter inserts a new line.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => setMessages([welcomeMessage()]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      time: timeNow(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The local welcome greeting is UI-only; it was never produced by
          // the model, so it is excluded from the conversation sent to the backend.
          messages: nextMessages.filter((m) => m.id !== "welcome"),
          provider: "openai",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error: ${response.status} - ${text}`);
      }

      const json = await response.json();
      const reply =
        json.reply || json.content || json.text || "(Empty response from AI)";

      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-ai`, role: "assistant", content: reply, time: timeNow() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: error.message,
          time: timeNow(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resize the textarea as the advocate types, capped at ~6 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Keep the latest message in view.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Let Escape close full-screen mode.
  useEffect(() => {
    if (!isFullScreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullScreen]);

  const wrapperClass = isFullScreen
    ? "fixed inset-0 z-50 flex flex-col bg-white"
    : "flex h-full flex-col border-l border-gray-200 bg-white";

  return (
    <div className={wrapperClass}>
      {/* Local keyframes so the message fade-in works even if tailwind.config.js
          hasn't been extended with a custom "fadeIn" animation. */}
      <style>{`
        @keyframes tntFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: tntFadeIn 0.2s ease-out; }
      `}</style>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white shadow-md">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-300">
            <ScaleIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight">TNT Legal Assistant</h3>
            <p className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Powered by TNT AI
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear conversation"
            className="rounded-md p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullScreen((v) => !v)}
            title={isFullScreen ? "Exit full screen" : "Expand to full screen"}
            className="rounded-md p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {isFullScreen ? <CollapseIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto bg-gray-50 ${isFullScreen ? "px-6 py-8" : "p-4"}`}>
        <div className={`space-y-4 ${isFullScreen ? "mx-auto max-w-3xl" : ""}`}>
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                {!isUser && (
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      m.isError ? "bg-red-100 text-red-600" : "bg-slate-900 text-white"
                    }`}
                  >
                    {m.isError ? <AlertIcon className="h-3.5 w-3.5" /> : <ScaleIcon className="h-3.5 w-3.5" />}
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition ${
                    isUser
                      ? "rounded-br-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
                      : m.isError
                      ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-800 hover:shadow-lg"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.time && (
                    <div className={`mt-1 text-[10px] italic ${isUser ? "text-blue-100" : "text-gray-400"}`}>
                      {m.time}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white shadow-md">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2.5 justify-start animate-fadeIn">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                <ScaleIcon className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-bl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 shadow-sm">
                <span className="animate-pulse">AI is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className={`shrink-0 border-t border-gray-200 bg-white ${isFullScreen ? "px-6 py-4" : "p-3"}`}>
        <div className={isFullScreen ? "mx-auto max-w-3xl" : ""}>
          {contextText && contextText.trim() && (
            <div className="mb-2 flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
              <InfoIcon className="h-3 w-3 shrink-0" />
              Using selected editor text as context
            </div>
          )}

          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/40">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your legal query..."
              className="max-h-40 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm text-black placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400">Press Enter to send, Shift + Enter for a new line.</p>
        </div>
      </form>
    </div>
  );
}