import React, { useEffect, useState } from "react";

const InquiryList = () => {
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/api/inquiries`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setInquiries(data))
      .catch(err => console.error("Error fetching inquiries:", err));
  }, []);

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Inquiries</h3>
      {inquiries.length === 0 ? (
        <p className="text-slate-400">No inquiries yet.</p>
      ) : (
        <ul className="space-y-2">
          {inquiries.map(inq => (
            <li key={inq._id} className="p-3 bg-slate-700 rounded-lg">
              <p className="font-bold">{inq.inquirerName}</p>
              <p className="text-sm text-slate-300">{inq.typeOfCase}</p>
              <p className="text-sm text-slate-400">{inq.summary}</p>
              <p className="text-xs text-slate-500">
                Follow-up: {inq.followUpDate?.slice(0,10)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InquiryList;
