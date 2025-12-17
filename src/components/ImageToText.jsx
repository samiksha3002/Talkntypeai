import React, { useState } from "react";

const ImageToText = ({ onExtract }) => {
  const [loading, setLoading] = useState(false);

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("http://localhost:5000/api/ocr/image-to-text", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.text) {
      onExtract(data.text);
    } else {
      onExtract("No text found.");
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={uploadImage}
      />

      {loading && <p>Extracting text...</p>}
    </div>
  );
};

export default ImageToText;