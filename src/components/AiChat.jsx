// src/components/AiChat.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function AiChat({ contextText }) {

  // ✅ ALWAYS call backend on Render
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const API_URL = `${API_BASE_URL}/api/chat`;

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'system',
      content:
        "Hello Advocate! I am TNT AI. I can help you draft legal documents based on Indian Law. Try asking: 'Draft a bail application'."
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleInputChange = (e) => setInput(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log("🔵 Sending request to:", API_URL);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error: ${response.status} - ${text}`);
      }

      const json = await response.json();
      console.log("🟢 Backend JSON:", json);

      const reply =
        json.reply ||
        json.content ||
        json.text ||
        "(Empty response from AI)";

      const botMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: reply
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("🔴 Chat Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: `❌ ${error.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">

      {/* Header */}
      <div className="bg-slate-900 text-white p-3 shadow-md">
        <h3 className="font-bold text-sm flex items-center gap-2">
          ⚖️ TNT Legal Assistant
        </h3>
        <p className="text-[10px] text-gray-400">
          Powered by Google Gemini
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((m) => {
          if (m.role === 'system') return null;

          return (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border rounded-bl-none'
                }`}
              >
                <strong className="block text-[10px] mb-1 opacity-70 uppercase">
                  {m.role === 'user' ? 'You' : 'TNT AI'}
                </strong>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gray-200 text-gray-500 text-xs px-3 py-2 rounded-lg">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t flex gap-2"
      >
        <input
          className="flex-1 bg-gray-50 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-black"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a legal query..."
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white p-2 rounded-md disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
