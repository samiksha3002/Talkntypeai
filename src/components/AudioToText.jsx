import React, { useState } from "react";
import axios from "axios";

const AudioToText = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const uploadAudio = async () => {
    if (!file) {
      alert("Please select an audio file!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    setLoading(true);
    setErrorMsg("");
    setText("");

    try {
      const res = await axios.post(
        "https://tnt-gi49.onrender.com/api/audio-to-text",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        setText(res.data.text);
      } else {
        setErrorMsg("Failed to transcribe audio.");
      }

    } catch (err) {
      console.error("AUDIO ERROR:", err);
      setErrorMsg("Something went wrong while transcribing audio.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>🎤 Audio to Text</h2>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ marginTop: "10px" }}
      />

      <button
        onClick={uploadAudio}
        disabled={loading}
        style={{
          marginTop: "15px",
          padding: "10px 20px",
          cursor: "pointer",
          background: "#4A90E2",
          color: "white",
          borderRadius: "5px",
          border: "none",
        }}
      >
        {loading ? "⏳ Transcribing..." : "Convert to Text"}
      </button>

      {errorMsg && (
        <p style={{ color: "red", marginTop: "10px" }}>{errorMsg}</p>
      )}

      {text && (
        <div style={{ marginTop: "20px" }}>
          <h3>📝 Transcription:</h3>
          <p>{text}</p>
        </div>
      )}
    </div>
  );
};

export default AudioToText;
