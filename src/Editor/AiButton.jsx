const AiButton = ({ label, color, onClick }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700 border-blue-400",
    purple: "bg-purple-100 text-purple-700 border-purple-400",
    green: "bg-emerald-100 text-emerald-700 border-emerald-400"
  };

  return (
    <button
      onClick={onClick}
      // Note: Added border color class to colors object for better styling consistency
      className={`px-3 py-1.5 text-xs font-bold rounded border ${colors[color]} hover:scale-95 transition-transform duration-100`}
    >
      {label}
    </button>
  );
};

export default AiButton;