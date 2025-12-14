import React, { useState } from "react";
import axios from "axios";

const AudioToText = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadAudio = async () => {
    if (!file) return alert("Please upload a file!");

    const formData = new FormData();
    formData.append("audio", file);

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/audio-to-text", formData);
      setText(res.data.text);
    } catch (err) {
      console.error(err);
      alert("Error transcribing audio");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Audio to Text</h2>

      <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])} />

      <button onClick={uploadAudio} disabled={loading}>
        {loading ? "Transcribing..." : "Convert to Text"}
      </button>

      {text && (
        <div>
          <h3>Transcription:</h3>
          <p>{text}</p>
        </div>
      )}
    </div>
  );
};

export default AudioToText;
