// src/pages/ManageTeamPage.jsx
import React, { useEffect, useState } from "react";

const ManageTeamPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/team`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        const data = await res.json();
        console.log("Fetched team data:", data); // 👀 debug

        // Handle both array and object response shapes
        if (Array.isArray(data)) {
          setMembers(data);
        } else if (Array.isArray(data.members)) {
          setMembers(data.members);
        } else {
          console.error("Unexpected API response:", data);
          setMembers([]);
        }
      } catch (err) {
        console.error("Error fetching team members:", err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Team Members</h1>

      {loading ? (
        <p>Loading team members...</p>
      ) : members.length === 0 ? (
        <p>No team members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m._id || m.email} className="p-3 bg-slate-800 rounded-lg">
              <p className="font-bold">
                {m.fullName} ({m.role})
              </p>
              <p className="text-sm text-slate-400">
                {m.email} {m.phone ? `| ${m.phone}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageTeamPage;
