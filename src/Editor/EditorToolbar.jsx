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

  // सामान्य बटन शैली: कोई बॉक्स नहीं, सिर्फ बड़ा आइकन, होवर पर हल्का प्रभाव
  const buttonStyle = "p-2 text-3xl hover:bg-gray-100 rounded-full transition-colors";

  return (
    <>
      {/* कंटेनर को दाईं ओर संरेखित किया गया (justify-end)।
         बटनों के बीच गैप बढ़ाया (gap-4)।
         आइकनों को लंबवत केंद्रित किया (items-center)।
      */}
      <div className="flex justify-end items-center mb-2 gap-4">
        <button className={buttonStyle} title="Save">
          💾
        </button>
        <button className={buttonStyle} title="Print">
          🖨️
        </button>
        
        {/* Commands Button */}
        <button
          onClick={() => setShowCommands(true)}
          className={`${buttonStyle} text-indigo-600 hover:bg-indigo-50`}
          title="Voice Commands"
        >
          🎙️
        </button>

        {/* Clear Button */}
        <button
          onClick={() => setManualText("")}
          className={`${buttonStyle} text-red-600 hover:bg-red-50`}
          title="Clear Text"
        >
          🗑️
        </button>
      </div>

      {/* Voice Commands Modal (Unchanged) */}
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
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
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