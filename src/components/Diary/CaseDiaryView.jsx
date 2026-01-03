// src/components/Diary/CaseDiaryView.jsx
import React from "react";
import { Briefcase, ChevronRight, Clock, AlertCircle } from "lucide-react";

// ✅ Receive 'tasks' and 'loading' directly from props (passed by Diary.jsx)
const CaseDiaryView = ({ tasks, loading, navigate }) => {

  // 1. Loading State
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        Checking schedule...
      </div>
    );
  }

  // 2. Empty State (No tasks found)
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-full">
        <div className="bg-slate-700/50 p-4 rounded-full mb-4">
          <Clock className="w-10 h-10 text-slate-500" />
        </div>
        <p className="text-slate-300 font-medium text-lg">No tasks found</p>
        <p className="text-slate-500 text-sm mt-1 max-w-[200px]">
          No hearings or inquiries scheduled for this date.
        </p>
        <button 
            onClick={() => navigate('/add-case')}
            className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/30 px-4 py-2 rounded-lg hover:bg-blue-500/10 transition"
        >
            + Add New Case
        </button>
      </div>
    );
  }

  // 3. List of Tasks
  return (
    <div className="divide-y divide-slate-700 max-h-[500px] overflow-y-auto custom-scrollbar">
      {tasks.map((task, index) => (
        <div
          key={`${task.type}-${index}`}
          onClick={() => {
            // Smart Navigation based on Type
            if (task.type === "CASE") navigate(`/case/edit/${task.id}`);
            if (task.type === "INQUIRY") navigate(`/edit-inquiry/${task.id}`);
          }}
          className="p-4 hover:bg-slate-700/50 transition cursor-pointer flex items-center group"
        >
          {/* Icon based on Type (Blue for Cases, Orange for Inquiries) */}
          <div className={`p-3 rounded-xl mr-4 ${
            task.type === "CASE" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
          }`}>
            {task.type === "CASE" ? <Briefcase size={20} /> : <AlertCircle size={20} />}
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
                <h4 className="text-slate-200 font-semibold truncate text-base">
                {task.title}
                </h4>
            </div>
            
            <p className="text-slate-400 text-xs truncate mb-1">
              {task.subtitle}
            </p>
            
            <div className="flex items-center gap-2">
                {/* Type Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide ${
                    task.type === 'CASE' ? 'bg-blue-900/40 text-blue-200' : 'bg-orange-900/40 text-orange-200'
                }`}>
                    {task.type}
                </span>
                
                {/* Description Snippet */}
                {task.description && (
                    <span className="text-slate-600 text-[10px] truncate max-w-[100px] italic">
                        — {task.description}
                    </span>
                )}
            </div>
          </div>

          <ChevronRight className="text-slate-600 group-hover:text-white transition w-5 h-5 ml-2" />
        </div>
      ))}
      
      {/* View All Link at Bottom */}
      <div className="p-4 pt-2">
        <button 
            onClick={() => navigate('/manage-cases')}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-indigo-400 hover:bg-slate-700/30 rounded transition"
        >
            View All Cases →
        </button>
      </div>
    </div>
  );
};

export default CaseDiaryView;