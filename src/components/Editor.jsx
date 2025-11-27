import React from 'react';

const Editor = () => {
  return (
    // CHANGE 1: p-4 ko p-2 kiya taaki upar se gap kam ho aur editor "proper place" par aaye
    // CHANGE 2: w-full add kiya taaki width poori cover ho
    <div className="flex-1 h-full w-full p-2 flex flex-col overflow-hidden">
      
      {/* Top Icon Bar (Actions) */}
      {/* CHANGE 3: 'flex-none' add kiya taaki ye shrink na ho */}
      <div className="flex-none flex justify-end gap-2 mb-2 overflow-x-auto pb-1">
        <ActionIcon icon="↺" /> 
        <ActionIcon icon="💬" /> 
        <ActionIcon icon="A" />  
        <ActionIcon icon="📋" /> 
        <ActionIcon icon="🖨️" /> 
        <ActionIcon icon="✅" bg="bg-emerald-500 text-white border-emerald-600" /> 
        <ActionIcon icon="✏️" bg="bg-emerald-500 text-white border-emerald-600" /> 
        <ActionIcon icon="⤢" /> 
        <ActionIcon icon="📄" /> 
        <ActionIcon icon=">_" /> 
        <ActionIcon icon="🗑️" bg="bg-red-100 text-red-500 border-red-200" /> 
        <ActionIcon icon="🔊" /> 
        <ActionIcon icon="💾" /> 
        <ActionIcon icon="💾" bg="bg-indigo-600 text-white border-indigo-700" /> 
      </div>

      {/* Main Editor Container */}
      {/* CHANGE 4: 'flex-1' ensure karega ki ye bachi hui height le le, par overflow na ho */}
      <div className="flex-1 bg-white rounded-lg border border-blue-500 flex flex-col shadow-sm overflow-hidden relative">
        
        {/* Toolbar Row */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-3 flex-wrap text-gray-700 text-sm flex-none">
          <select className="bg-transparent border border-gray-300 rounded px-2 py-1 text-xs outline-none">
            <option>Sans Serif</option>
            <option>Serif</option>
          </select>
          <select className="bg-transparent border border-gray-300 rounded px-2 py-1 text-xs outline-none">
            <option>Normal</option>
            <option>Heading 1</option>
          </select>
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          <div className="flex gap-2 text-gray-600">
            <ToolBtn symbol="B" bold />
            <ToolBtn symbol="I" italic />
            <ToolBtn symbol="U" underline />
            <ToolBtn symbol="S" strike />
          </div>
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          <ToolBtn symbol="A" />
          <ToolBtn symbol="Highlighter" />
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          <div className="flex gap-2">
            <ToolBtn symbol="≡" /> 
            <ToolBtn symbol="≣" /> 
            <ToolBtn symbol="≡" /> 
          </div>
        </div>

        {/* Text Area */}
        {/* CHANGE 5: resize-none important hai taaki layout na toote */}
        <textarea 
          className="flex-1 w-full p-6 outline-none resize-none text-gray-800 font-sans text-base leading-relaxed overflow-y-auto"
          placeholder="Start speaking or typing here..."
        ></textarea>

        {/* Moving Text Strip */}
        <div className="h-8 flex-none bg-yellow-100 border-t border-yellow-300 flex items-center overflow-hidden relative">
            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 h-full flex items-center z-10 shadow-md">
                NOTICE:
            </div>
            <div className="whitespace-nowrap overflow-hidden w-full">
                <div className="inline-block animate-marquee text-sm text-yellow-800 font-medium">
                    Welcome to SuperSteno! Please ensure your microphone is connected for speech input. • New languages added: Marathi & Gujarati! • Contact support for license renewal.
                </div>
            </div>
        </div>

      </div>

      {/* CSS for Marquee Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
          padding-left: 100%; 
        }
      `}</style>

    </div>
  );
};

// --- Helper Components (Same as before) ---
const ActionIcon = ({ icon, bg = "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50" }) => (
  <button className={`w-9 h-9 rounded border flex items-center justify-center shadow-sm transition flex-shrink-0 ${bg}`}>
    <span className="text-sm font-bold">{icon}</span>
  </button>
);

const ToolBtn = ({ symbol, bold, italic, underline, strike }) => {
  let classes = "hover:text-blue-600 transition px-1 cursor-pointer flex items-center justify-center h-6 w-6";
  if (bold) classes += " font-bold";
  if (italic) classes += " italic font-serif";
  if (underline) classes += " underline";
  if (strike) classes += " line-through";
  return <button className={classes}>{symbol}</button>;
};

export default Editor;