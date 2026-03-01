// FooterButtons.jsx के अंदर
const FooterButtons = ({ setActiveView, activeView }) => {
  return (
    <div className="flex justify-around items-center h-full">
      {/* ... बाकी बटन्स ... */}
      
      <button 
        onClick={() => setActiveView("legalHub")}
        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'legalHub' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
      >
        Legal AI Hub
      </button>

      {/* एडिटर पर वापस जाने के लिए एक बटन होना चाहिए */}
      <button 
        onClick={() => setActiveView("editor")}
        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'editor' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
      >
        Editor
      </button>
    </div>
  );
};