import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import DraftSignIn from '../DraftSignIn.jsx';
import { recoveryKey, rememberDraft, recoverDraft, recoverSaver, forgetDraft } from '../draftRecovery.js';
import { draftRequest, DraftSaver, validDocument, getDraftSession } from '../draftClient.js';
import { sanitizeDraftHtml } from '../../../../utils/draftHtml.js';
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
  function prepareTemplateContent(rawContent = "") {
  let text = rawContent

  // For the Regular Bail master template, keep only
  // the actual court pleading and conditional annexures.
  const pleadingStart = text.indexOf("# PART B")
  const internalEnd = text.indexOf("# PART E")

  if (pleadingStart !== -1 && internalEnd !== -1) {
    text = text.slice(pleadingStart, internalEnd)
  }

  // Convert Markdown headings, lists and bold text to HTML.
  const html = marked.parse(text)

  // Sanitize generated HTML before displaying it.
  return DOMPurify.sanitize(
    highlightPlaceholders(html)
  )
}


export default function DraftCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: savedId } = useParams();
  const templateId = new URLSearchParams(location.search).get('templateId') || location.state?.templateId || location.state?.draftId;
  const editorRef = useRef(null);
  const saver = useRef(null);
  const dirty = useRef(false);
  const loadedHtml = useRef('');
  const currentHtml = useRef('');
  const loadedTemplateId = useRef(null);
  const bufferKey = recoveryKey(getDraftSession(), location.pathname + location.search);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retry, setRetry] = useState(0);
  const documentType = template?.title || 'Document';
  const category = template?.category || '';
  useEffect(() => {
    if (dirty.current && (savedId ? saver.current?.document?._id === savedId : loadedTemplateId.current === templateId)) return;
    if (savedId && saver.current?.document?._id === savedId) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError(''); setSuccessMessage(''); setTemplate(null);
    saver.current = null;
    (async () => {
      try {
        if (!savedId && !templateId) throw new Error('Select a template from Draft Studio to start a document.');
        const result = await draftRequest(savedId ? '/user-drafts/' + savedId : '/drafts/' + templateId,
          { signal: controller.signal, publicRequest: !savedId });
        const data = result.data;
        if (savedId ? !validDocument(data) || data._id !== savedId : !data || data._id !== templateId || typeof (data.templateBody || data.content) !== 'string') throw new Error('Invalid document response. Nothing has been substituted.');
        if (!active) return;
        loadedTemplateId.current = templateId;
        setTemplate(data);
        loadedHtml.current = savedId ? DOMPurify.sanitize(sanitizeDraftHtml(data.content)) : prepareTemplateContent(data.templateBody || data.content);
        saver.current = recoverSaver(bufferKey) || new DraftSaver(draftRequest, savedId ? data : null);
        const recovered = recoverDraft(bufferKey);
        if (recovered !== undefined) { loadedHtml.current = DOMPurify.sanitize(sanitizeDraftHtml(recovered)); setSuccessMessage('Unsaved text recovered from this tab. Review and save it.'); }
        currentHtml.current = loadedHtml.current;
        dirty.current = recovered !== undefined;
      } catch (e) { if (active) setError(e.message || 'Could not load document.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [savedId, templateId, retry, bufferKey]);
  useEffect(() => {
    if (!loading && editorRef.current && template) editorRef.current.innerHTML = loadedHtml.current;
  }, [loading, template]);
  useEffect(() => {
    const warn = event => { if (dirty.current || saver.current?.busy) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  useEffect(() => () => {
    if (dirty.current) rememberDraft(bufferKey, currentHtml.current, saver.current);
    else forgetDraft(bufferKey);
  }, [bufferKey]);
  const leave = path => {
    if ((dirty.current || saver.current?.busy) && !window.confirm('Leave this document? Unsaved changes will be lost.')) return;
    navigate(path);
  };
  const handleEditorInput = () => { currentHtml.current = editorRef.current?.innerHTML || ''; dirty.current = true; rememberDraft(bufferKey, currentHtml.current, saver.current); setSuccessMessage(''); };
  const applyFormat = command => { editorRef.current?.focus(); document.execCommand(command, false, null); handleEditorInput(); };
  const handleSaveDraft = async () => {
    if (!saver.current || saver.current.busy) return;
    if (!editorRef.current?.innerText?.trim()) { setError('Document cannot be empty.'); return; }
    const snapshot = DOMPurify.sanitize(sanitizeDraftHtml(editorRef.current.innerHTML));
    setSaving(true); setError(''); setSuccessMessage('');
    try {
      const result = await saver.current.save({ title: template.title, category, templateId: saver.current.document?.templateId || templateId, content: snapshot });
      const current = DOMPurify.sanitize(sanitizeDraftHtml(editorRef.current.innerHTML));
      dirty.current = current !== snapshot;
      currentHtml.current = current;
      if (!dirty.current) forgetDraft(bufferKey);
      setSuccessMessage(dirty.current ? 'Submitted version saved. You have newer unsaved changes.' : 'Draft saved successfully.');
      // The load effect recognizes this already-loaded identity and preserves newer typing.
      if (!savedId) navigate('/draft/edit/' + result._id, { replace: true });
    } catch (e) { setError(e.message || 'Save failed. Your unsaved text has been kept.'); }
    finally { setSaving(false); }
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

    if (!template) return <main className="p-8"><p role="alert">{error}</p><DraftSignIn onSuccess={() => setRetry(n => n + 1)} /><button onClick={() => setRetry(n => n + 1)}>Retry</button> <button onClick={() => leave('/draft-studio')}>Draft Studio</button></main>;
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => leave("/drafts")}>My Drafts</button>
          <header className="mb-8">
            <button
              type="button"
              onClick={() => leave(-1)}
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
            <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <DraftSignIn onSuccess={() => { setError('Session renewed. Click Save Draft to retry.'); }} />
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(editorRef.current?.innerText || ''); setSuccessMessage('Unsaved text copied.'); } catch { setError('Select and copy the document text manually.'); } }}>Copy unsaved text</button>
            </div>
          )}

          {successMessage && (
            <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
                Your document is saved separately from the original template. Keep this page open if a save fails.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => leave(-1)}
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