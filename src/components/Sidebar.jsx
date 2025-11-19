import React from 'react';

const Sidebar = () => {
  return (
    <aside className="w-72 bg-white h-[calc(100vh-64px)] border-r border-gray-200 p-4 overflow-y-auto fixed left-0 top-16">
      
      {/* Speech Input Card */}
      <ToolCard title="SPEECH INPUT" icon="🎙️">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>English (India)</option>
          <option>Hindi</option>
          <option>Marathi</option>
        </select>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded font-medium flex items-center justify-center gap-2 transition shadow-sm">
          <span>🎙️</span> Start Listening
        </button>
      </ToolCard>

      {/* Translation Card */}
      <ToolCard title="TRANSLATION" icon="🈯">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>English</option>
          <option>Hindi</option>
        </select>
        <button className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded flex items-center justify-center transition">
          ⇄ {/* Swap Icon Placeholder */}
        </button>
      </ToolCard>

      {/* Transliteration Card */}
      <ToolCard title="TRANSLITERATION" icon="⌨️">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>Hindi</option>
          <option>Marathi</option>
        </select>
        <button className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded font-medium transition">
          Enable
        </button>
      </ToolCard>

      {/* Font Conversion Card */}
      <ToolCard title="FONT CONVERSION" icon="A">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>Krutidev</option>
          <option>Mangal</option>
        </select>
        <button className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded flex items-center justify-center transition">
          ⇄
        </button>
      </ToolCard>

    </aside>
  );
};

// Helper Component for uniform cards
const ToolCard = ({ title, icon, children }) => (
  <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100">
    <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
      <span className="bg-white p-1 rounded shadow-sm">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

export default Sidebar;