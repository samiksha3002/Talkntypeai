// editor.api.js

// 🔥 Universal API Base URL (Production + Localhost safe)
const API = window.location.hostname === "localhost"
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
  if (!text?.trim()) return alert("Type something first");

  safeSetLoading(setLoading, true);

  try {
    const res = await fetch(`${API}/api/fix-grammar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Grammar API returned non-JSON:", text);
      alert("Grammar API failed");
      return;
    }

    const data = await res.json();
    setText(data.fixed || "");
  } catch (err) {
    console.error("Grammar API error:", err);
    alert("Failed to fix grammar.");
  }

  safeSetLoading(setLoading, false);
};

// ------------------------------------------------------
// ✔ EXPAND TEXT
// ------------------------------------------------------
export const expandText = async (text, setText, setLoading) => {
  if (!text?.trim()) return;

  safeSetLoading(setLoading, true);

  try {
    const res = await fetch(`${API}/api/expand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Expand API returned non-JSON:", text);
      alert("Expand API failed");
      return;
    }

    const data = await res.json();
    setText(data.expanded || "");
  } catch (err) {
    console.error("Expand API error:", err);
    alert("Failed to expand text.");
  }

  safeSetLoading(setLoading, false);
};

// ------------------------------------------------------
// ✔ IMAGE → TEXT (OCR)
// ------------------------------------------------------
export const uploadOCR = async (e, setText, setLoading) => {
  const file = e.target.files[0];
  if (!file) return;

  safeSetLoading(setLoading, true);

  try {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`${API}/api/ocr/image-to-text`, {
      method: "POST",
      body: fd
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("OCR API returned non-JSON:", text);
      alert("OCR API failed");
      return;
    }

    const data = await res.json();
    const extracted = data.text || "No text found";

    setText(prev => (prev + "\n" + extracted).trim());
  } catch (err) {
    console.error("OCR API error:", err);
    alert("Failed to process OCR.");
  }

  safeSetLoading(setLoading, false);
};

// ------------------------------------------------------
// ✔ AUDIO → TEXT
// ------------------------------------------------------
export const uploadAudio = async (e, setText, setLoading) => {
  const file = e.target.files[0];
  if (!file) return;

  safeSetLoading(setLoading, true);

  try {
    const fd = new FormData();
    fd.append("audio", file);

    const res = await fetch(`${API}/api/audio-to-text`, {
      method: "POST",
      body: fd
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Audio API returned non-JSON:", text);
      alert("Audio API failed");
      return;
    }

    const data = await res.json();
    const extracted = data.text || "Could not transcribe audio";

    setText(prev => (prev + "\n" + extracted).trim());
  } catch (err) {
    console.error("Audio API error:", err);
    alert("Failed to process audio.");
  }

  safeSetLoading(setLoading, false);
};

// ------------------------------------------------------
// ✔ AI DRAFT GENERATION
// ------------------------------------------------------
export async function generateDraftAPI(body) {
  const res = await fetch(`${API}/api/draft/generate-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error("Draft API failed");
  }

  return res.json();
}

// ------------------------------------------------------
// ✔ PDF → TEXT
// ------------------------------------------------------
export const uploadPDF = async (e, setManualText, setLoading) => {
  const file = e.target.files[0];
  if (!file) return;

  safeSetLoading(setLoading, true);

  try {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API}/api/upload-pdf`, {
      method: "POST",
      body: fd
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("PDF API returned non-JSON:", text);
      alert("PDF upload failed. Check console for details.");
      return;
    }

    const data = await res.json();

    if (data.text) {
      setManualText(data.text);
    } else {
      alert("Failed to extract text from PDF.");
    }
  } catch (err) {
    console.error("PDF API error:", err);
    alert("Error processing PDF.");
  }

  safeSetLoading(setLoading, false);
};
