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


export const uploadAudio = async (e, setText, setLoading) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("audio", file);

  safeSetLoading(setLoading, true);

  try {
    const { data } = await axios.post(`${API}/api/audio-to-text`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (data.text) {
      setText((prev) => (prev + "\n" + data.text).trim());
    } else {
      alert("Could not transcribe audio.");
    }
  } catch (err) {
    console.error("Audio API error:", err.response?.data || err.message);
    alert("Failed to process audio.");
  } finally {
    safeSetLoading(setLoading, false);
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
