import React, { useState, useEffect } from 'react';

const Hero = () => {
  const images = [
    '/hero4.png',
    '/hero6.png',
    '/hero5.png',
    '/hero2.png',
    '/hero1.png',
    '/hero3.png',
    '/hero7.png'
  ];

  // --- स्लाइडर सेटिंग्स ---
  const widthPercent = 100;
  const heightPercent = 100;
  const imageFit = "fill"; 
  // ----------------------

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    // CHANGE HERE: h-[90vh] को बदलकर h-screen कर दिया गया है
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Sliding Container */}
      <div 
        className="flex w-full h-full transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, index) => (
          <div 
            key={index} 
            className="w-full h-full flex-shrink-0 flex items-center justify-center"
          >
            <img
              src={img}
              alt={`Slide ${index}`}
              style={{ 
                width: `${widthPercent}%`, 
                height: `${heightPercent}%`,
                objectFit: imageFit 
              }}
            />
          </div>
        ))}
      </div>

    </div>
  );
};

export default Hero;