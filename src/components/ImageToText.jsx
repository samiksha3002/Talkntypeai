import React, { useState } from "react";

const ImageToText = ({ onExtract }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect API URL (Local + Render live domain)
  const API_URL =
    import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api/ocr/image-to-text`
      : "http://localhost:5000/api/ocr/image-to-text";

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        onExtract("OCR failed.");
        return;
      }

      onExtract(data.text || "No text found.");

    } catch (err) {
      console.error("OCR Frontend Error:", err);
      setLoading(false);
      setError("Network error. Please try again.");
      onExtract("Error occurred.");
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={uploadImage} />

      {loading && <p>Extracting text...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ImageToText;
