// ✅ Always use hardcoded API base URL (production safe)
const API = "https://tnt-gi49.onrender.com";

// ✅ Grammar Fix
export const fixGrammar = async (text, setText, setLoading) => {
  if (!text?.trim()) return alert("Type something first");
  setLoading(true);

  try {
    const res = await fetch(`${API}/api/fix-grammar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    setText(data.fixed || "");
  } catch (err) {
    console.error("Grammar API error:", err);
    alert("Failed to fix grammar");
  } finally {
    setLoading(false);
  }
};

// ✅ Expand Text
export const expandText = async (text, setText, setLoading) => {
  if (!text?.trim()) return;
  setLoading(true);

  try {
    const res = await fetch(`${API}/api/expand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    setText(data.expanded || "");
  } catch (err) {
    console.error("Expand API error:", err);
    alert("Failed to expand text");
  } finally {
    setLoading(false);
  }
};

// ✅ OCR Upload
export const uploadOCR = async (e, setText, setLoading) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`${API}/api/ocr/image-to-text`, {
      method: "POST",
      body: fd
    });

    const data = await res.json();
    setText(prev => (prev + "\n" + (data.text || "")).trim());
  } catch (err) {
    console.error("OCR API error:", err);
    alert("Failed to process OCR");
  } finally {
    setLoading(false);
  }
};

// ✅ Audio Upload
export const uploadAudio = async (e, setText, setLoading) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("audio", file);

    const res = await fetch(`${API}/api/audio-to-text`, {
      method: "POST",
      body: fd
    });

    const data = await res.json();
    setText(prev => (prev + "\n" + (data.text || "")).trim());
  } catch (err) {
    console.error("Audio API error:", err);
    alert("Failed to process audio");
  } finally {
    setLoading(false);
  }
};

// ✅ Draft Generation
export async function generateDraftAPI(data) {
  const res = await fetch(`${API}/api/draft/generate-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Draft API failed");
  }

  return res.json();
}
// editor.api.js

export const uploadPDF = async (e, setManualText, setLoadingState, API) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoadingState(true);
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API}/upload-pdf`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.text) {
      setManualText(data.text);
    } else {
      alert("Failed to extract text from PDF");
    }
  } catch (err) {
    console.error("PDF upload error:", err);
    alert("Error processing PDF");
  } finally {
    setLoadingState(false);
  }
};

