import React from 'react';

const FontConvertCard = ({ onFontConvert, isConverting }) => {
    // ⚠️ Ismein aapko actual font selection logic (dropdown) dalna padega.
    // Filhaal, hum 'krutidev' font ke liye ek hardcoded button banate hain.
    const handleConvert = () => {
        onFontConvert('krutidev'); // 'krutidev' code pass karega Dashboard ko
    };

    return (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-md mb-4">
            <h3 className="text-sm font-bold text-orange-700 uppercase mb-2">
                🅰️ Font Conversion
            </h3>
            
            {/* 1. Dropdown for Font Selection (Aap ismein aur fonts add kar sakte hain) */}
            <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    Convert Editor Text to Font:
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="krutidev">Krutidev 10</option>
                    <option value="mangala">Mangal (Unicode)</option>
                </select>
            </div>
            
            {/* 2. Conversion Button */}
            <button
                onClick={handleConvert}
                disabled={isConverting}
                className={`w-full py-2 px-4 rounded-xl text-white font-semibold transition-colors ${
                    isConverting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-orange-500 hover:bg-orange-600'
                }`}
            >
                {isConverting ? 'Converting...' : 'Convert Font'}
            </button>
        </div>
    );
};

export default FontConvertCard;