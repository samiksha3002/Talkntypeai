import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';

const EditCasePage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    caseName: '',
    caseNumber: '',
    courtName: '',
    hearingDate: '',
    description: ''
  });

  // 1. Fetch Data on Load
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        // Backend API call to get single case
        const res = await fetch(`https://talkntypeai.onrender.com/api/cases/${id}`);
        const data = await res.json();
        
        if (data.success && data.case) {
          // Date format fix for input type="date"
          let formattedDate = '';
          if (data.case.hearingDate) {
            formattedDate = new Date(data.case.hearingDate).toISOString().split('T')[0];
          }

          setFormData({
            caseName: data.case.caseName || '',
            caseNumber: data.case.caseNumber || '',
            courtName: data.case.courtName || '',
            hearingDate: formattedDate, 
            description: data.case.description || ''
          });
        } else {
          alert("Failed to load case details.");
          navigate('/manage-cases');
        }
      } catch (err) {
        console.error("Error fetching case:", err);
        alert("Network Error: Could not load case.");
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id, navigate]);

  // 2. Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Update (Submit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.caseName || !formData.hearingDate) {
      alert("Case Name and Hearing Date are required!");
      return;
    }

    try {
      const res = await fetch(`https://talkntypeai.onrender.com/api/cases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        alert("Case Updated Successfully!");
        navigate('/manage-cases'); // Redirect to list
      } else {
        alert(data.message || "Update Failed");
      }
    } catch (err) {
      console.error("Error updating case:", err);
      alert("Something went wrong while updating.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex justify-center">
      <div className="w-full max-w-2xl bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-indigo-400">Edit Case Details</h1>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Case Name */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Case Name / Parties</label>
            <input 
              type="text" 
              name="caseName"
              value={formData.caseName} 
              onChange={handleChange}
              placeholder="e.g. Sharma vs State"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          {/* Case Number & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Case Number</label>
              <input 
                type="text" 
                name="caseNumber"
                value={formData.caseNumber} 
                onChange={handleChange}
                placeholder="e.g. S123/2024"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Next Hearing Date</label>
              <input 
                type="date" 
                name="hearingDate"
                value={formData.hearingDate} 
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          {/* Court Name */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Court Name / Location</label>
            <input 
              type="text" 
              name="courtName"
              value={formData.courtName} 
              onChange={handleChange}
              placeholder="e.g. High Court Nagpur"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description / Notes</label>
            <textarea 
              name="description"
              rows="4"
              value={formData.description} 
              onChange={handleChange}
              placeholder="Add details about the hearing or case status..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center transition shadow-lg mt-2"
          >
            <Save size={20} className="mr-2" /> Save Changes
          </button>

        </form>
      </div>
    </div>
  );
};

export default EditCasePage;