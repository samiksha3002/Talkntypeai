import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import legalTemplates from "../../../../data/legalTemplates.json";

const API_URL = "http://localhost:5000/api";

// Converts {{placeholder}} -> a highlighted, editable-looking [PLACEHOLDER]
// span, so blanks are obvious to the user inside the rendered document.
function highlightPlaceholders(html) {
  return html.replace(
    /{{\s*([a-zA-Z0-9_]+)\s*}}/g,
    (_, key) =>
      `<span style="background:#ede9fe;color:#6d28d9;padding:1px 6px;border-radius:6px;font-weight:600;">[${key
        .replace(/_/g, " ")
        .toUpperCase()}]</span>`
  );
}

export default function DraftCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const editorRef = useRef(null);

  // Extract data from DraftStudio
  const documentType = location.state?.documentType || "Untitled Document";
  const category = location.state?.category || "General";
  const draftId = location.state?.draftId || null;

  const [template, setTemplate] = useState(null);
  const [content, setContent] = useState(""); // always kept as raw HTML string

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      // 1. If a saved draft id was passed, load that exact saved draft from the DB.
      if (draftId) {
        try {
          const response = await fetch(`${API_URL}/drafts/${draftId}`);
          const result = await response.json();

          if (response.ok && result.data) {
            setTemplate(result.data);
            setContent(result.data.templateBody || result.data.content || "");
            setLoading(false);
            return; // Stop here if DB fetch was successful
          }
        } catch (err) {
          console.error("Failed to load saved draft, falling back to template library...", err);
        }
      }

      // 2. No draft id (or DB fetch failed) — load the actual legal template
      //    that matches the selected document type, from the template library.
      const matchedTemplate = legalTemplates.find(
        (t) => t.title.trim().toLowerCase() === documentType.trim().toLowerCase()
      );

      if (matchedTemplate) {
        setTemplate(matchedTemplate);
        setContent(highlightPlaceholders(matchedTemplate.content));
      } else {
        // 3. Only as a last resort (title truly not found anywhere) — blank skeleton.
        setTemplate({ title: documentType, category });
        setContent(`<p><b>${documentType}</b></p><p>Start typing your draft here...</p>`);
      }

      setLoading(false);
    };

    loadTemplate();
  }, [draftId, documentType, category]);

  // Push the loaded template HTML into the editable area whenever it changes.
  // We intentionally do NOT re-sync on every keystroke (that would reset the
  // cursor position) — the editor is uncontrolled after this initial paint.
  useEffect(() => {
    if (editorRef.current && !loading) {
      editorRef.current.innerHTML = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, template]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      setSuccessMessage("");
    }
  };

  const applyFormat = (command) => {
    editorRef.current?.focus();
    document.execCommand(command, false, null);
    handleEditorInput();
  };

  const handleSaveDraft = async () => {
    const plainTextCheck = editorRef.current?.innerText?.trim() || "";
    if (!plainTextCheck) {
      setError("Template content cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: template?.title || documentType,
          documentType,
          category: template?.category || category,
          templateId: template?._id || draftId, // null if it came from the local template library
          content,
          status: "saved",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      setSuccessMessage("Draft saved successfully.");

      setTimeout(() => {
        navigate("/drafts", {
          state: { message: "Draft saved successfully." },
        });
      }, 700);
    } catch (err) {
      console.error("Draft save error:", err);
      setError(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto flex min-h-[300px] max-w-4xl items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <h2 className="text-lg font-semibold text-slate-800">Opening template...</h2>
            <p className="mt-2 text-sm text-slate-500">Please wait while we prepare your document.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            <span className="text-lg">←</span> Back
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {template?.title || documentType}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {template?.category || category}
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                TEMPLATE EDITOR
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Edit your document</h2>
              <p className="mt-1 text-sm text-slate-500">
                Make changes to the template before saving your draft. Replace the highlighted
                [BRACKETED] fields with the actual case details.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>

          {/* Simple formatting toolbar for the rich-text editor below */}
          <div className="mb-3 flex gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => applyFormat("bold")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => applyFormat("italic")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm italic text-slate-700 hover:bg-slate-100"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => applyFormat("underline")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm underline text-slate-700 hover:bg-slate-100"
              title="Underline"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => applyFormat("insertUnorderedList")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              title="Bullet list"
            >
              • List
            </button>
          </div>

          {/* Rich-text editable area — renders the legal template as real
              formatted text (bold headings, paragraphs) instead of raw
              HTML tags, while still storing/saving it as an HTML string. */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="min-h-[650px] w-full overflow-y-auto rounded-xl border border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-800 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100 [&_hr]:my-4 [&_hr]:border-slate-300 [&_p]:mb-3"
          />

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Your changes will be saved as a separate draft. The original template will remain unchanged.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}