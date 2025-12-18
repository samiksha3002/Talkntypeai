// ✅ Use env variable from Vite
const API = import.meta.env.VITE_API_URL || "https://tnt-gi49.onrender.com";


// ✅ Grammar Fix
export const fixGrammar = async (text, setText, setLoading, API_URL = API) => {
  if (!text?.trim()) return alert("Type something first");
  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/api/fix-grammar`, {
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
export const expandText = async (text, setText, setLoading, API_URL = API) => {
  if (!text?.trim()) return;
  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/api/expand`, {
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
export const uploadOCR = async (e, setText, setLoading, API_URL = API) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`${API_URL}/api/ocr/image-to-text`, {
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
export const uploadAudio = async (e, setText, setLoading, API_URL = API) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("audio", file);

    const res = await fetch(`${API_URL}/api/audio-to-text`, {
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
export async function generateDraftAPI(data, API_URL = API) {
  const res = await fetch(`${API_URL}/api/draft/generate-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Draft API failed");
  }

  return res.json();
}
