// src/pages/ManageInquiries.jsx
import React, { useEffect, useState } from "react";
import { Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch inquiries on mount
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_URL}/api/inquiries`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // if using JWT
          },
        });
        const data = await res.json();
        setInquiries(data);
      } catch (err) {
        console.error("Error fetching inquiries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  // Delete inquiry
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      await fetch(`${API_URL}/api/inquiries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setInquiries(inquiries.filter((inq) => inq._id !== id));
    } catch (err) {
      console.error("Error deleting inquiry:", err);
    }
  };

  // Navigate to edit page (you can build EditInquiryPage later)
  const handleEdit = (id) => {
    navigate(`/edit-inquiry/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Inquiries</h1>

      {loading ? (
        <p className="text-slate-400">Loading inquiries...</p>
      ) : inquiries.length === 0 ? (
        <p className="text-slate-400">No inquiries found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-800 border border-slate-700 rounded-lg">
            <thead>
              <tr className="bg-slate-700 text-slate-300">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Contact</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Summary</th>
                <th className="py-3 px-4 text-left">Follow-up</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq._id} className="border-t border-slate-700">
                  <td className="py-3 px-4">{inq.inquirerName}</td>
                  <td className="py-3 px-4">{inq.contactNumber}</td>
                  <td className="py-3 px-4">{inq.typeOfCase}</td>
                  <td className="py-3 px-4">{inq.summary}</td>
                  <td className="py-3 px-4">
                    {inq.followUpDate ? inq.followUpDate.slice(0, 10) : "-"}
                  </td>
                  <td className="py-3 px-4 flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(inq._id)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(inq._id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageInquiries;
