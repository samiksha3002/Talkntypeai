// editor.api.js
import axios from "axios";

// 🔥 Universal API Base URL (Production + Localhost safe)
const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://talkntypeai.onrender.com";

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
// editor.api.js

// editor.api.js

export const uploadOCR = async (fileOrEvent, setManualText, setLoading) => {
  // SMART CHECK: Determine if we received an event or a direct file
  const file = fileOrEvent?.target?.files ? fileOrEvent.target.files[0] : fileOrEvent;

  if (!file) {
    console.error("No image selected");
    return;
  }

  setLoading(true);
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`${API}/api/ocr/image-to-text`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      const formattedText = data.text.replace(/\n/g, "<br />");
      setManualText(prev =>
        prev ? prev + "<br /><br />" + formattedText : formattedText
      );
    } else {
      console.error("OCR failed:", data.error);
    }
  } catch (err) {
    console.error("OCR error:", err);
  } finally {
    setLoading(false);
  }
};
// ------------------------------------------------------
// ✔ AUDIO → TEXT

export const uploadAudio = async (e, setManualText, setIsAudioLoading, API_URL) => {
  // Fix for "e is not defined"
  const file = (e && e.target && e.target.files) ? e.target.files[0] : e;
  if (!file) return;

  const formData = new FormData();
  formData.append("audio", file);

  setIsAudioLoading(true);
  try {
    const response = await fetch(`${API}/api/audio/transcribe`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      setManualText(prev => prev ? `${prev} ${data.transcript}` : data.transcript);
    }
  } catch (error) {
    console.error("Transcription error:", error);
  } finally {
    setIsAudioLoading(false);
  }
};
// ------------------------------------------------------
// ✔ PDF → TEXT
// editor.api.js

// Change this to match your old project's logic but new project's URL variables
// editor.api.js
export const uploadPDF = async (file, setManualText, setLoading) => {
  if (!file) {
    console.error("No PDF selected");
    return;
  }

  setLoading(true);
  const formData = new FormData();
  formData.append("file", file); // Ensure your backend looks for 'file'

  try {
    const response = await fetch(`${API}/api/upload-pdf`, {
      method: "POST",
      body: formData,
    });

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      throw new Error(`Server Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.success) {
      const formattedText = data.text.replace(/\n/g, "<br />");
      setManualText((prev) =>
        prev ? prev + "<br /><br />" + formattedText : formattedText
      );
    } else {
      console.error("PDF Processing Error:", data.error);
      alert("Backend Error: " + data.error);
    }
  } catch (error) {
    console.error("Detailed Error:", error);
    alert(`PDF Error: ${error.message}`); // This will now show the REAL error from the server
  } finally {
    setLoading(false);
  }
};// ------------------------------------------------------
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
