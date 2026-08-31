import React, { useEffect, useRef, useState } from "react";

/* ---------- Inline icons ---------- */
function ScaleIcon(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3v18" /><path d="M5 7h14" /><path d="M5 7 2 13a3 3 0 0 0 6 0L5 7Z" /><path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" /><path d="M8 21h8" /></svg>); }
function SendIcon(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></svg>); }
function ExpandIcon(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>); }
function CollapseIcon(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 3H3v6" /><path d="M15 21h6v-6" /><path d="M3 3l7 7" /><path d="M21 21l-7-7" /></svg>); }
function AlertIcon(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>); }
function TrashIcon(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>); }

/* ------------------------------------------------------------------------- */

const API_URL = import.meta.env.VITE_API_URL || "https://talkntypeai.onrender.com/api/chat";

const timeNow = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const welcomeMessage = () => ({
  id: "welcome",
  role: "assistant",
  content: `Hello Advocate. I am TNT AI, your legal research and drafting assistant for Indian law. You can ask a legal query, discuss a matter, or request a draft — for example, "Draft a bail application".`,
  time: timeNow(),
});

export default function AiChat() {
  const [messages, setMessages] = useState([welcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => setInput(e.target.value);

  const handleKeyDown = (e) => {
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
          messages: nextMessages.filter((m) => m.id !== "welcome"),
          provider: "openai" // default provider, can extend with dropdown
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error: ${response.status} - ${text}`);
      }

      const json = await response.json();
      const reply = json.reply || "(Empty response from AI)";

      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-ai`, role: "assistant", content: reply, time: timeNow() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: error.message, time: timeNow(), isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const wrapperClass = isFullScreen
    ? "fixed inset-0 z-50 flex flex-col bg-white"
    : "flex h-full flex-col border-l border-gray-200 bg-white";

  return (
    <div className={wrapperClass}>
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
          <button onClick={handleClearChat} title="Clear conversation" className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
            <TrashIcon className="h-4 w-4" />
          </button>
          <button onClick={() => setIsFullScreen((v) => !v)} title={isFullScreen ? "Exit full screen" : "Expand to full screen"} className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
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
              <div key={m.id} className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isUser
                      ? "rounded-br-sm bg-blue-600 text-white"
                      : m.isError
                      ? "rounded-bl-sm border border-red-100 bg-red-50 text-red-700"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.time && (
                    <div className={`mt-1 text-[10px] ${isUser ? "text-blue-100" : "text-gray-400"}`}>{m.time}</div>
                  )}
                </div>

                {isUser && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                    You
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t border-gray-200 bg-white px-4 py-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
