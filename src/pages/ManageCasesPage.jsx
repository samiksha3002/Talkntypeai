// src/pages/ManageCasesPage.jsx
import React from 'react';
import { ChevronLeft, Briefcase, Calendar, List, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '../context/CaseContext'; // Assuming path is correct

const ManageCasesPage = () => {
  const navigate = useNavigate();
  // Get all cases and the function to add/remove cases (if implemented) from Context
  // Note: For now, we only use allCases.
  const { allCases } = useCases(); 

  const handleEditCase = (caseId) => {
    alert(`Navigating to edit case with ID: ${caseId}`);
    // TODO: In the future, navigate to a CaseDetail/Edit page: navigate(`/case/edit/${caseId}`)
  };

  const handleDeleteCase = (caseId) => {
    if (window.confirm(`Are you sure you want to delete Case ID ${caseId}? (Simulated)`)) {
        console.log(`Deleting case with ID: ${caseId}`);
        // TODO: In the future, call a function from useCases to remove the case from the array/backend
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold flex items-center">
                <Briefcase size={20} className="mr-2 text-indigo-400" /> Manage All Cases ({allCases.length})
            </h1>
        </div>
        <button 
            onClick={() => navigate('/add-case')}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition"
        >
            <PlusCircle size={18} className="mr-1" />
            Add New
        </button>
      </div>

      {/* Case List */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
            <List size={16} className="mr-2" /> Recent Cases (Sorted by date added)
        </h3>
        
        {allCases.length === 0 ? (
          <div className="p-8 bg-slate-800 rounded-xl border border-slate-700 text-center">
             <p className="text-slate-400">No cases found. Use the "Add New" button above to get started.</p>
          </div>
        ) : (
          allCases.map((caseItem) => (
            <div 
              key={caseItem.id} 
              className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition shadow-lg flex justify-between items-center"
            >
              {/* Case Details (Left Side) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                    <h2 className="text-lg font-bold text-slate-100 truncate">{caseItem.caseName}</h2>
                    <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 hidden sm:block">
                        {caseItem.caseNumber || 'N/A'}
                    </span>
                </div>
                <p className="text-sm text-slate-400">
                  <Calendar size={14} className="inline mr-1 text-slate-500" /> 
                  **Next Hearing:** {caseItem.hearingDate} ({caseItem.courtName})
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {caseItem.description}
                </p>
              </div>

              {/* Actions (Right Side) */}
              <div className="flex space-x-2 ml-4">
                <button 
                    onClick={() => handleEditCase(caseItem.id)}
                    title="Edit Case"
                    className="p-2 rounded-full text-indigo-400 hover:bg-indigo-900/50 transition"
                >
                    <Edit size={18} />
                </button>
                <button 
                    onClick={() => handleDeleteCase(caseItem.id)}
                    title="Delete Case"
                    className="p-2 rounded-full text-red-400 hover:bg-red-900/50 transition"
                >
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageCasesPage;