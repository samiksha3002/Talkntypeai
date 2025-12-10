// src/components/MenuOption.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react'; // Ek chhota arrow icon end mein add karte hain

const MenuOption = ({ title, desc, icon, path }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(path)}
      // Tailwind styling for the menu card
      className="group flex items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-all cursor-pointer active:scale-95"
    >
      {/* Icon Container (Left Side) */}
      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mr-4 shadow-sm group-hover:bg-slate-800">
        {icon}
      </div>
      
      {/* Text Content (Middle Section) */}
      <div className="flex-1">
        <h4 className="text-base font-bold text-slate-100 mb-0.5">{title}</h4>
        <p className="text-xs text-slate-400 leading-tight">{desc}</p>
      </div>
      
      {/* Arrow Icon (Right Side) */}
      <div className="ml-4 text-slate-500 group-hover:text-green-500 transition-colors">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};

export default MenuOption;