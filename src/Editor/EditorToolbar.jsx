import { useState } from "react";

const EditorToolbar = ({ setManualText }) => {
  const [showCommands, setShowCommands] = useState(false);

  const COMMANDS = [
    { symbol: ",", en: "comma", hi: "अल्पविराम", mr: "स्वल्पविराम" },
    { symbol: ".", en: "full stop", hi: "पूर्ण विराम", mr: "पूर्णविराम" },
    { symbol: ".", en: "dot", hi: "डॉट", mr: "डॉट" },
    { symbol: "!", en: "exclamation", hi: "विस्मयादिबोधक चिन्ह", mr: "आश्चर्यवाचक चिन्ह" },
    { symbol: "?", en: "question mark", hi: "प्रश्नवाचक चिन्ह", mr: "प्रश्नचिन्ह" },
    { symbol: ":", en: "colon", hi: "कोलन", mr: "कोलन" },
    { symbol: ";", en: "semi colon", hi: "अर्धविराम", mr: "अर्धविराम" },
    { symbol: "-", en: "dash", hi: "डैश", mr: "डॅश" },
    { symbol: "/", en: "slash", hi: "स्लैश", mr: "स्लॅश" }
  ];

  return (
    <>
      <div className="flex justify-between mb-2">
        <div className="flex gap-2">
          <button className="p-2 bg-white border rounded">💾</button>
          <button className="p-2 bg-white border rounded">🖨️</button>
          <button
            onClick={() => setManualText("")}
            className="p-2 bg-red-100 text-red-600 border rounded"
          >
            🗑️
          </button>
          <button
            onClick={() => setShowCommands(true)}
            className="p-2 bg-indigo-100 text-indigo-600 border rounded"
          >
            🎙️ Commands
          </button>
        </div>
      </div>

      {/* Voice Commands Modal */}
      {showCommands && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[500px] rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🎙️ Voice Commands</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">English</th>
                  <th className="border p-2">Hindi</th>
                  <th className="border p-2">Marathi</th>
                </tr>
              </thead>
              <tbody>
                {COMMANDS.map((cmd, i) => (
                  <tr key={i}>
                    <td className="border p-2 text-center">{cmd.symbol}</td>
                    <td className="border p-2">{cmd.en}</td>
                    <td className="border p-2">{cmd.hi}</td>
                    <td className="border p-2">{cmd.mr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowCommands(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorToolbar;
