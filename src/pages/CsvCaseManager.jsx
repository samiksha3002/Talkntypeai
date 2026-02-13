import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileUp, Download } from "lucide-react";

const CsvCaseManager = ({ userId, API }) => {
  const [cases, setCases] = useState([]);
  const [importing, setImporting] = useState(false);

  // 1. List Fetch Karein (Page load hote hi)
  useEffect(() => {
    fetchCases();
  }, [userId]);

  const fetchCases = async () => {
    try {
      const res = await axios.get(`${API}/api/csv-manager/list/${userId}`);
      setCases(res.data);
    } catch (err) {
      console.error("Error fetching list");
    }
  };

  // 2. CSV Upload Function
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    setImporting(true);
    try {
      const res = await axios.post(`${API}/api/csv-manager/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
      fetchCases(); // Upload ke baad list refresh karein
    } catch (err) {
      alert("Error uploading CSV");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // 3. Sample Download Logic
  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Id,LastDate,Court,MatterNo,First Party,Second Party,Next Date\n1,01/01/2024,High Court,WP 101/24,Amit,State,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Sample_Case_Format.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📂 CSV Case Manager</h2>
        
        <div className="flex gap-2">
          {/* Upload Button */}
          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer">
            <FileUp size={18} />
            {importing ? "Importing..." : "Upload CSV"}
            <input type="file" accept=".csv" onChange={handleCSVUpload} hidden disabled={importing} />
          </label>

          {/* Sample Download */}
          <button onClick={downloadSample} className="p-2 text-gray-500 hover:text-blue-600 border rounded">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">ID</th>
              <th className="border p-2 text-left">Last Date</th>
              <th className="border p-2 text-left">Court</th>
              <th className="border p-2 text-left">Matter No</th>
              <th className="border p-2 text-left">First Party</th>
              <th className="border p-2 text-left">Second Party</th>
            </tr>
          </thead>
          <tbody>
            {cases.length > 0 ? (
              cases.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2">{c.serialNo}</td>
                  <td className="border p-2">{c.lastDate}</td>
                  <td className="border p-2">{c.courtName}</td>
                  <td className="border p-2 font-bold text-blue-800">{c.caseNumber}</td>
                  <td className="border p-2">{c.petitioner}</td>
                  <td className="border p-2">{c.respondent}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center p-4">No data. Upload a CSV file.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CsvCaseManager;