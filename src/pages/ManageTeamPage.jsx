import React, { useEffect, useState } from "react";

const ManageTeamPage = () => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/api/team`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Team Members</h1>
      {members.length === 0 ? (
        <p>No team members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map(m => (
            <li key={m._id} className="p-3 bg-slate-800 rounded-lg">
              <p className="font-bold">{m.fullName} ({m.role})</p>
              <p className="text-sm text-slate-400">{m.email} | {m.phone}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageTeamPage;
