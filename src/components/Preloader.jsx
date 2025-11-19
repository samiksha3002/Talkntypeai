import React from 'react';

const Preloader = () => {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center overflow-hidden">
      <video
        src="/flash screen.mp4"    // Make sure file name matches exactly in public folder
        autoPlay            // Starts automatically
        muted               // REQUIRED: Browsers block autoplay if sound is on
        playsInline         // Better support for mobile
        className="w-full h-full object-cover" // Makes video cover the whole screen
      />
    </div>
  );
};

export default Preloader;