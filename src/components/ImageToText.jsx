import React, { useState } from "react";

const ImageToText = ({ onExtract }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect API URL (Compatible with Vite)
  const API_URL = import.meta.env.VITE_API_URL
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image.");
      }

      // ✅ Success: Pass the structured text to parent
      onExtract(data.text || "No text found.");

    } catch (err) {
      console.error("OCR Frontend Error:", err);
      setError("Failed to extract text. Is the backend running?");
      onExtract("Error: Could not extract text.");
    } finally {
      setLoading(false);
      e.target.value = ""; // ✅ Reset input so user can upload the same file again if needed
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden input style or custom button style can be added here */}
      <input 
        type="file" 
        accept="image/*" 
        onChange={uploadImage}
        disabled={loading}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100
        "
      />

      {loading && <p className="text-sm text-indigo-600 font-medium animate-pulse">⏳ Extracting text with layout...</p>}
      {error && <p className="text-sm text-red-500 font-medium">⚠️ {error}</p>}
    </div>
  );
};

export default ImageToText;