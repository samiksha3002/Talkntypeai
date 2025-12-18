import React, { useEffect, useState } from 'react';
import { ChevronLeft, Briefcase, Calendar, List, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageCasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch cases for logged-in user
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("User not authenticated. Please log in again.");
      navigate('/login');
      return;
    }

    const fetchCases = async () => {
      try {
        // Corrected URL: Backend automatically adds /api/cases from server.js
        const res = await fetch(`https://tnt-gi49.onrender.com/api/cases/user/${userId}`);
        
        // Safety check if response is not JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          if (data.success) {
            setCases(data.cases);
          } else {
            console.error("Backend Error:", data.message);
          }
        }
      } catch (err) {
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [navigate]);

  // Delete case logic
  const handleDeleteCase = async (caseId) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;

    try {
      const res = await fetch(`https://tnt-gi49.onrender.com/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (data.success) {
        alert("Case deleted successfully!");
        // Update UI state immediately
        setCases(prev => prev.filter(c => c._id !== caseId));
      } else {
        alert(data.message || "Failed to delete case");
      }
    } catch (err) {
      console.error("Error deleting case:", err);
      alert("Network error while deleting case. Check if your backend is live.");
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
            <Briefcase size={20} className="mr-2 text-indigo-400" /> Manage All Cases ({cases.length})
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
          <List size={16} className="mr-2" /> Recent Cases
        </h3>
        
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-8 bg-slate-800 rounded-xl border border-slate-700 text-center">
            <p className="text-slate-400">No cases found. Add your first case to see it here.</p>
          </div>
        ) : (
          cases.map((caseItem) => (
            <div 
              key={caseItem._id} 
              className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition shadow-lg flex justify-between items-center"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-slate-100 truncate">{caseItem.caseName}</h2>
                  <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300">
                    {caseItem.caseNumber || 'No ID'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 flex items-center">
                  <Calendar size={14} className="mr-1 text-slate-500" /> 
                  Next Hearing: <span className="text-slate-200 ml-1">{caseItem.hearingDate}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2 italic truncate">
                  {caseItem.courtName} — {caseItem.description || "No description provided."}
                </p>
              </div>

              <div className="flex space-x-2 ml-4">
                <button 
                  onClick={() => navigate(`/case/edit/${caseItem._id}`)}
                  className="p-2 rounded-full text-indigo-400 hover:bg-indigo-900/50 transition"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteCase(caseItem._id)}
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