// src/components/Diary/CaseDiaryView.jsx
import React from 'react';
import { useCases } from '../../context/CaseContext'; 
import { format } from 'date-fns';
import { Briefcase, Clock, ArrowRight } from 'lucide-react';

const CaseDiaryView = ({ selectedDate, navigate }) => {
  // CRITICAL LINE: Safely destructure, assuming useCases returns an object.
  // The ultimate fix is in CaseContext.jsx (see below).
  const { allCases } = useCases() || {}; 
  
  // Safety check: If allCases is not an array (due to the missing Provider), default to an empty array.
  const casesData = Array.isArray(allCases) ? allCases : [];

  // Format the selected date for filtering
  const dateToFilter = format(selectedDate, 'yyyy-MM-dd');
  
  // Filter cases for the selected date
  const casesForDay = casesData.filter(caseItem => 
    caseItem.hearingDate === dateToFilter
  );

  return (
    <div className="space-y-4">
      
      {casesForDay.length === 0 ? (
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-center">
          <Clock size={32} className="text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No hearings scheduled for this date.
          </p>
          <button 
            onClick={() => navigate('/add-case')}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            + Add a new case entry
          </button>
        </div>
      ) : (
        casesForDay.map((caseItem) => (
          <div 
            key={caseItem.id} 
            className="bg-slate-800 p-4 rounded-xl border border-blue-600/50 shadow-md cursor-pointer hover:bg-slate-700/50 transition"
            onClick={() => navigate(`/manage-cases`)} // Example navigation
          >
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-base font-bold text-slate-100 flex items-center">
                <Briefcase size={16} className="mr-2 text-blue-400" />
                {caseItem.caseName}
              </h4>
              <ArrowRight size={16} className="text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 leading-tight">
              {caseItem.courtName} ({caseItem.caseNumber})
            </p>
          </div>
        ))
      )}
      
      {/* Link to all cases */}
      <button 
        onClick={() => navigate('/manage-cases')}
        className="w-full mt-2 py-2 text-sm font-semibold text-indigo-400 border border-indigo-400 rounded-lg hover:bg-indigo-400/10 transition"
      >
        View All Cases
      </button>
    </div>
  );
};

export default CaseDiaryView;