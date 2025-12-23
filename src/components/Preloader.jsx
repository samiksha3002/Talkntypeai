import React from 'react';

const Preloader = () => {
  // --- यहाँ से आप वीडियो का साइज़ कंट्रोल करें ---
  const widthPercent = 100;   // 100 मतलब पूरी चौड़ाई
  const heightPercent = 100;  // 100 मतलब पूरी ऊंचाई
  const videoFit = "fill";    // विकल्प: "fill" (पूरा भरने के लिए), "contain" (बिना कटे), "cover" (ज़ूम करके)
  const bgColor = "bg-white"; // बैकग्राउंड कलर
  // ------------------------------------------

  return (
    <div className={`fixed inset-0 ${bgColor} z-[9999] flex items-center justify-center overflow-hidden`}>
      <video
        src="/loading screen try.mp4" 
        autoPlay 
        muted 
        playsInline 
        loop // आमतौर पर प्रीलोडर वीडियो लूप पर अच्छा लगता है
        style={{ 
          width: `${widthPercent}%`, 
          height: `${heightPercent}%`,
          objectFit: videoFit 
        }}
      />
    </div>
  );
};

export default Preloader;