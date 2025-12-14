const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const fixGrammar = async (text, setText, setLoading, API_URL = API) => {
  if (!text?.trim()) return alert("Type something first");
  setLoading(true);

  const res = await fetch(`${API_URL}/api/fix-grammar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  setText(data.fixed || "");
  setLoading(false);
};

export const expandText = async (text, setText, setLoading, API_URL = API) => {
  if (!text?.trim()) return;
  setLoading(true);

  const res = await fetch(`${API_URL}/api/expand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  setText(data.expanded || "");
  setLoading(false);
};

export const uploadOCR = async (e, setText, setLoading, API_URL = API) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch(`${API_URL}/api/ocr/image-to-text`, {
    method: "POST",
    body: fd
  });

  const data = await res.json();
  setText(prev => (prev + "\n" + (data.text || "")).trim());
  setLoading(false);
};

export const uploadAudio = async (e, setText, setLoading, API_URL = API) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  const fd = new FormData();
  fd.append("audio", file);

  const res = await fetch(`${API_URL}/api/audio-to-text`, {
    method: "POST",
    body: fd
  });

  const data = await res.json();
  setText(prev => (prev + "\n" + (data.text || "")).trim());
  setLoading(false);
};



export async function generateDraftAPI(data) {
  const res = await fetch(`${API_BASE_URL}/api/ai/generate-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Draft API failed");
  }

  return res.json();
}

