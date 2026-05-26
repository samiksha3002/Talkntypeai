import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Feather,
  Scale,
  BrainCircuit,
} from "lucide-react";

/* =====================================
   Premium Footer Button
===================================== */
const FooterTab = ({
  title,
  icon,
  active,
  onClick,
  color,
}) => {
  const colorStyles = {
    purple: {
      gradient:
        "from-violet-50 via-purple-50 to-fuchsia-100",
      iconBg:
        "bg-gradient-to-br from-violet-500 to-purple-600",
      glow: "bg-violet-500/20",
      text: "text-violet-700",
      active:
        "ring-2 ring-violet-400 shadow-violet-300/40",
    },

    orange: {
      gradient:
        "from-orange-50 via-amber-50 to-yellow-100",
      iconBg:
        "bg-gradient-to-br from-orange-500 to-amber-500",
      glow: "bg-orange-500/20",
      text: "text-orange-700",
      active:
        "ring-2 ring-orange-400 shadow-orange-300/40",
    },

    blue: {
      gradient:
        "from-blue-50 via-indigo-50 to-cyan-100",
      iconBg:
        "bg-gradient-to-br from-blue-500 to-indigo-600",
      glow: "bg-blue-500/20",
      text: "text-blue-700",
      active:
        "ring-2 ring-blue-400 shadow-blue-300/40",
    },
  };

  const style = colorStyles[color];

  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden
        flex items-center gap-3
        h-[68px]
        rounded-[22px]
        px-5
        border border-white/60
        bg-gradient-to-r ${style.gradient}
        backdrop-blur-xl
        shadow-md
        transition-all duration-300 ease-out
        hover:shadow-xl
        hover:-translate-y-[2px]
        hover:scale-[1.015]
        active:scale-[0.98]
        ${active ? style.active : ""}
      `}
    >
      {/* Glow effect */}
      <div
        className={`
          absolute
          -right-6
          -top-6
          h-20
          w-20
          rounded-full
          blur-2xl
          ${style.glow}
        `}
      />

      {/* Glossy top overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-70" />

      {/* Icon Box */}
      <div
        className={`
          relative z-10
          w-11 h-11
          rounded-2xl
          ${style.iconBg}
          flex items-center justify-center
          text-white
          shadow-lg
          shrink-0
        `}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col items-start">
        <span
          className={`
            font-bold text-[18px]
            tracking-tight
            ${style.text}
          `}
        >
          {title}
        </span>

        <span className="text-xs text-slate-500 font-medium">
          Open section
        </span>
      </div>

      {/* Active Indicator */}
      {active && (
        <div className="absolute right-4">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse block" />
        </div>
      )}
    </button>
  );
};

/* =====================================
   Main Footer Component
===================================== */
const FooterButtons = ({
  setActiveView,
  activeView,
}) => {
  const navigate = useNavigate();

  return (
    <footer className="h-[88px] border-t border-slate-200 bg-white px-4 flex items-center">

      {/* LEFT SIDE - SYSTEM STATUS */}
      <div className="w-[230px] flex items-center gap-2 text-sm font-medium text-slate-600 border-r border-slate-200 pr-5">

        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>

        <span>
          System Status:{" "}
          <span className="text-emerald-600 font-bold">
            Online
          </span>
        </span>
      </div>

      {/* RIGHT SIDE BUTTONS */}
      <div className="flex-1 grid grid-cols-3 gap-3 pl-5">

        {/* EDITOR */}
        <FooterTab
          title="Editor"
          color="purple"
          active={activeView === "editor"}
          icon={<Feather size={22} />}
          onClick={() =>
            setActiveView("editor")
          }
        />

        {/* JUDGEMENTS */}
        <FooterTab
          title="Judgements"
          color="orange"
          icon={<Scale size={22} />}
          onClick={() =>
            navigate("/judgements")
          }
        />

        {/* LEGAL AI HUB */}
        <FooterTab
          title="Legal AI Hub"
          color="blue"
          active={activeView === "legalHub"}
          icon={<BrainCircuit size={22} />}
          onClick={() =>
            setActiveView("legalHub")
          }
        />
      </div>
    </footer>
  );
};

export default FooterButtons;