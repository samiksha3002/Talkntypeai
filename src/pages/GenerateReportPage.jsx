import React, { useState } from "react";
import { ChevronLeft, Calendar, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const GenerateReportPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [reportDates, setReportDates] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setReportDates({ ...reportDates, [name]: value });
  };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    const { startDate, endDate } = reportDates;
    const userId = localStorage.getItem("userId"); // ✅ Get userId

    if (!userId) {
      alert("User session not found. Please login again.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after the end date.");
      return;
    }

    try {
      setLoading(true);
      const API_URL = "https://talkntypeai.onrender.com"; // ✅ Direct URL for stability

      // ✅ Added userId to query parameters
      const res = await fetch(
        `${API_URL}/api/reports?startDate=${startDate}&endDate=${endDate}&userId=${userId}`,
        {
          method: 'GET',
          headers: {
            "Content-Type": "application/pdf",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `CaseReport_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("Report downloaded successfully!");
    } catch (err) {
      console.error("Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Generate Case Report (PDF)</h1>
      </div>

      <form onSubmit={handleGeneratePDF} className="p-4 space-y-6 max-w-lg mx-auto mt-10">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
            <Calendar size={20} className="mr-2 text-red-400" /> Select Date Range
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={reportDates.startDate}
                onChange={handleDateChange}
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={reportDates.endDate}
                onChange={handleDateChange}
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition disabled:opacity-50 active:scale-95"
        >
          <Download size={20} className="mr-2" />
          {loading ? "Generating Report..." : "Download PDF Report"}
        </button>
      </form>
    </div>
  );
};

export default GenerateReportPage;