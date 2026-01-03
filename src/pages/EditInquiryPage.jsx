import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Phone, Mail, FileText, Save, Loader } from 'lucide-react';

const EditInquiryPage = () => {
  const { id } = useParams(); // URL se ID lena
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State to hold inquiry data
  const [formData, setFormData] = useState({
    inquirerName: '',
    contactNumber: '',
    email: '',
    typeOfCase: '',
    summary: '',
    followUpDate: '',
  });

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchInquiryDetails = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL; // Using Vite env
        const res = await fetch(`${API_URL}/api/inquiries/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`
            }
        });
        const data = await res.json();

        if (data) {
          // Date formatting for input type="date" (YYYY-MM-DD)
          let formattedDate = '';
          if (data.followUpDate) {
            formattedDate = new Date(data.followUpDate).toISOString().split('T')[0];
          }

          setFormData({
            inquirerName: data.inquirerName || '',
            contactNumber: data.contactNumber || '',
            email: data.email || '',
            typeOfCase: data.typeOfCase || '',
            summary: data.summary || '',
            followUpDate: formattedDate,
          });
        }
      } catch (err) {
        console.error("Error fetching inquiry:", err);
        alert("Failed to load inquiry details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiryDetails();
  }, [id]);

  // 2. Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 3. Handle Update (Submit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_URL}/api/inquiries/${id}`, {
        method: 'PUT', // PUT for update
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("Inquiry Updated Successfully!");
        navigate(-1); // Go back to the previous page (Manage Inquiries)
      } else {
        alert("Update Failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert('Error updating inquiry: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader className="animate-spin mr-2" /> Loading Details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="p-2 mr-2 text-slate-400 hover:text-white rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-orange-400">Edit Inquiry Details</h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-3xl mx-auto">
        
        {/* Contact Details Section */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center border-b border-slate-700 pb-2">
            <User size={20} className="inline mr-2 text-blue-400" /> Inquirer Information
          </h3>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                name="inquirerName"
                value={formData.inquirerName}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white outline-none"
              />
            </div>
            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <Phone size={14} className="inline mr-1" /> Phone
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <Mail size={14} className="inline mr-1" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Matter Details Section */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center border-b border-slate-700 pb-2">
            <FileText size={20} className="inline mr-2 text-blue-400" /> Matter Details
          </h3>
          <div className="space-y-4">
            {/* Type & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type of Case</label>
                <input
                    type="text"
                    name="typeOfCase"
                    value={formData.typeOfCase}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white outline-none"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Next Follow-up</label>
                <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white outline-none"
                />
                </div>
            </div>
            
            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Summary / Notes</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows="4"
                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50"
        >
          <Save size={20} className="mr-2" />
          {saving ? 'Updating...' : 'Update Inquiry'}
        </button>
      </form>
    </div>
  );
};

export default EditInquiryPage;