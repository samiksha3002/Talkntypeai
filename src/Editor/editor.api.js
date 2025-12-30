// editor.api.js
import axios from "axios";

// 🔥 Universal API Base URL (Production + Localhost safe)
const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://tnt-gi49.onrender.com";

// 🔒 Safe call for setLoading
const safeSetLoading = (fn, val) => {
  if (typeof fn === "function") fn(val);
};

// ------------------------------------------------------
// ✔ FIX GRAMMAR
// ------------------------------------------------------
export const fixGrammar = async (text, setText, setLoading) => {
  if (!text?.trim()) {
    alert("Type something first");
    return;
  }
  safeSetLoading(setLoading, true);

  try {
    const { data } = await axios.post(`${API}/api/fix-grammar`, { text });
    setText(data.fixed || "");
  } catch (err) {
    console.error("Grammar API error:", err.response?.data || err.message);
    alert("Failed to fix grammar.");
  } finally {
    safeSetLoading(setLoading, false);
  }
};

// ------------------------------------------------------
// ✔ EXPAND TEXT
// ------------------------------------------------------
export const expandText = async (text, setText, setLoading) => {
  if (!text?.trim()) return;
  safeSetLoading(setLoading, true);

  try {
    const { data } = await axios.post(`${API}/api/expand`, { text });
    setText(data.expanded || "");
  } catch (err) {
    console.error("Expand API error:", err.response?.data || err.message);
    alert("Failed to expand text.");
  } finally {
    safeSetLoading(setLoading, false);
  }
};

// ------------------------------------------------------
// ✔ IMAGE → TEXT (OCR)
// ------------------------------------------------------
export const uploadOCR = async (e, setText, setLoading) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("image", file);

  safeSetLoading(setLoading, true);

  try {
    const { data } = await axios.post(`${API}/api/ocr/image-to-text`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (data.success && data.text) {
      setText((prev) => (prev + "\n" + data.text).trim());
    } else {
      alert(data.error || "No text found in the image.");
    }
  } catch (err) {
    console.error("OCR API error:", err.response?.data || err.message);
    alert("Failed to extract text from image.");
  } finally {
    safeSetLoading(setLoading, false);
  }
};

// ------------------------------------------------------
// ✔ AUDIO → TEXT
// ------------------------------------------------------
// editor.api.js
export const uploadAudio = async (e, setManualText, setIsAudioLoading, API_URL) => {
  const file = e.target.files ? e.target.files[0] : e;
  if (!file) return;

  // Agar API_URL (prop) nahi mila, toh file ke upar wala 'API' use karo
  const finalURL = API_URL || API; 

  console.log("Requesting URL:", `${finalURL}/api/audio/transcribe`);

  const formData = new FormData();
  formData.append("audio", file); // Backend upload.single('audio') se match hona chahiye

  setIsAudioLoading(true);

  try {
    const response = await fetch(`${finalURL}/api/audio/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      // Transcript ko editor mein space ke sath add karein
      setManualText((prev) => prev + " " + data.transcript);
    } else {
      alert("Transcription failed: " + data.error);
    }
  } catch (error) {
    console.error("Audio upload error:", error);
    alert("Backend server se connect nahi ho pa raha hai.");
  } finally {
    setIsAudioLoading(false);
  }
};
// ------------------------------------------------------
// ✔ PDF → TEXT
// ------------------------------------------------------
export const uploadPDF = async (e, setText, setLoading) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("file", file);

  safeSetLoading(setLoading, true);

  try {
    const { data } = await axios.post(`${API}/api/upload-pdf`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (data.text) {
      setText(data.text);
    } else {
      alert(data.error || "Failed to extract text from PDF.");
    }
  } catch (err) {
    console.error("PDF API error:", err.response?.data || err.message);
    alert("Error processing PDF.");
  } finally {
    safeSetLoading(setLoading, false);
  }
};


// ------------------------------------------------------
// ✔ AI DRAFT GENERATION
// ------------------------------------------------------
export const generateDraftAPI = async (body) => {
  try {
    const { data } = await axios.post(`${API}/api/draft/generate-draft`, body, {
      headers: { "Content-Type": "application/json" },
    });
    return data;
  } catch (err) {
    console.error("Draft API error:", err.response?.data || err.message);
    throw new Error("Failed to generate draft");
  }
};
