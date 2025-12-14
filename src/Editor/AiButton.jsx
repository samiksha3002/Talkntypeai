const AiButton = ({ label, color, onClick }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-emerald-100 text-emerald-700"
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded border ${colors[color]} hover:scale-95`}
    >
      {label}
    </button>
  );
};

export default AiButton;
