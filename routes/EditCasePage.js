import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditCasePage = () => {
  const { id } = useParams(); // URL se ID nikalne ke liye (:id wala part)
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);

  useEffect(() => {
    // Yaha us ID ka use karke backend se data fetch karein
    const fetchCaseDetails = async () => {
      try {
        const res = await fetch(`https://tnt-gi49.onrender.com/api/cases/${id}`); // Single case fetch API
        const data = await res.json();
        if (data.success) {
          setCaseData(data.case);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCaseDetails();
  }, [id]);

  if (!caseData) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="text-white p-5">
      <h1>Edit Case: {id}</h1>
      {/* Yaha apna Form banayein jisme caseData ki values pre-filled ho */}
      <button onClick={() => navigate(-1)} className="bg-gray-500 p-2 mt-4 rounded">Back</button>
    </div>
  );
};

export default EditCasePage;