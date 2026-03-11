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

export const uploadOCR = async (e, setManualText, setLoading) => {

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
// Example fix for your frontend upload function
const uploadPDF = async (file) => {
  try {
    // 1. Validation: Ensure it's actually a PDF
    if (file.type !== "application/pdf") {
      console.error("Selected file is not a PDF");
      return;
    }

    // 2. Prepare the data
    const formData = new FormData();
    // IMPORTANT: The key "file" must match upload.single("file") in your Express route
    formData.append("file", file); 

    // 3. Make the Request
    const response = await fetch("https://talkntypeai.onrender.com/api/upload-pdf", {
      method: "POST",
      body: formData, // Do NOT set Content-Type header; fetch does it for FormData
    });

    const result = await response.json();

    if (result.success) {
      console.log("PDF Text:", result.text);
      // Update your editor state here
      // setEditorContent(result.text); 
    } else {
      console.error("Upload failed:", result.error);
    }
  } catch (error) {
    console.error("Network Error:", error);
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
