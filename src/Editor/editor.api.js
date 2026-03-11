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

export const uploadOCR = async (e, setManualText, setLoading, API) => {

  const file = e?.target?.files?.[0];
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

      // convert \n to <br> for Quill editor
      const formattedText = data.text.replace(/\n/g, "<br />");

      setManualText(prev =>
        prev ? prev + "<br /><br />" + formattedText : formattedText
      );

    } else {
      console.error("OCR failed:", data.error);
      alert("OCR processing failed");
    }

  } catch (err) {

    console.error("OCR error:", err);
    alert("Failed to extract text");

  } finally {

    setLoading(false);

    if (e.target) e.target.value = null;

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
export const uploadPDF = async (file, setManualText, setLoading, API_URL) => {

  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  setLoading(true);

  try {

    const response = await fetch(`${API}/api/upload-pdf`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setManualText(prev => prev ? `${prev}\n\n${data.text}` : data.text);
    }

  } catch (error) {

    console.error("PDF upload error:", error);

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
