// src/pages/AddTeamMemberPage.jsx
import React, { useState } from "react";
import { ChevronLeft, UserPlus, Mail, Phone, Lock, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AddTeamMemberPage = () => {
  const navigate = useNavigate();

  // State to hold team member data
  const [memberDetails, setMemberDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "Staff", // Default role
  });

  const [loading, setLoading] = useState(false);

  // Available roles/access levels
  const roles = ["Staff", "Associate", "Admin"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMemberDetails({ ...memberDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = "https://tnt-gi49.onrender.com";

      console.log("Submitting team member:", memberDetails); // 👀 debug

      const res = await fetch(`${API_URL}/api/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // safe fallback
        },
        body: JSON.stringify(memberDetails),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add team member");
      }

      alert(`Invitation sent to ${data.member.fullName} (${data.member.role})!`);

      // Clear the form
      setMemberDetails({ fullName: "", email: "", phone: "", role: "Staff" });

      // Navigate to manage team page
      navigate("/manage-team");
    } catch (err) {
      console.error("Error adding team member:", err.message);
      alert("Error adding team member: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-xl font-bold">Add Team Member</h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Basic Information Section */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <UserPlus size={20} className="inline mr-2 text-teal-400" /> Member Contact
          </h3>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={memberDetails.fullName}
                onChange={handleInputChange}
                placeholder="Team Member's Name"
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-white"
              />
            </div>
            {/* Email & Phone (Grouped) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  <Mail size={14} className="inline mr-1" /> Email (for login)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={memberDetails.email}
                  onChange={handleInputChange}
                  placeholder="login@email.com"
                  required
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  <Phone size={14} className="inline mr-1" /> Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={memberDetails.phone}
                  onChange={handleInputChange}
                  placeholder="Contact Number"
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Access Level Section */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <Lock size={20} className="inline mr-2 text-teal-400" /> Access Level
          </h3>
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Select Role / Permissions
            </label>
            <select
              id="role"
              name="role"
              value={memberDetails.role}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-white appearance-none pr-8"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            *Admin can add/remove users. Staff can only view and update assigned cases.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition duration-200 active:scale-98 disabled:opacity-50"
        >
          <Save size={20} className="mr-2" />
          {loading ? "Sending..." : "Send Team Invitation"}
        </button>
      </form>
    </div>
  );
};

export default AddTeamMemberPage;
