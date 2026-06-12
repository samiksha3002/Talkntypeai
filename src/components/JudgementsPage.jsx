// frontend/src/pages/JudgementsPage.jsx — Light theme, all fixes applied

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Bookmark, Building2, Calendar,
  Users, Gavel, Printer, Copy, ExternalLink,
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
  ChevronDown, X, Sparkles,
} from 'lucide-react';

import { useLatestJudgements, useSearch, useJudgement, useSaved } from '../components/Hooks/usejudgements';
import { useSearchContext } from '../components/Context/searchcontext.jsx';
import { formatDate, getCourtInfo, truncate } from '../components/utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Court Badge
// ─────────────────────────────────────────────────────────────────────────────
function CourtBadge({ courtName }) {
  const name = courtName || '';
  const isSupreme = name.toLowerCase().includes('supreme');
  const isHC = name.toLowerCase().includes('high');
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 4,
      background: isSupreme ? '#FEE2E2' : isHC ? '#DBEAFE' : '#F3F4F6',
      color: isSupreme ? '#991B1B' : isHC ? '#1E40AF' : '#374151',
    }}>
      {isSupreme ? 'SC India' : name.replace(' High Court', ' HC') || 'Unknown'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Headnote — tries multiple response fields
// ─────────────────────────────────────────────────────────────────────────────
function Headnote({ doc }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [shown,   setShown]   = useState(false);
  const [error,   setError]   = useState('');

 const generate = async () => {
  if (summary) { setShown(s => !s); return; }
  setLoading(true);
  setShown(true);
  setError('');
  try {
    const text = ((doc.snippet || '') + ' ' + (doc.fulltext || '')).slice(0, 3000);
    const prompt = `You are a legal expert. Summarize this Indian court judgment in exactly 3 bullet points:\n\nCase: ${doc.title}\nCourt: ${doc.court}\nDate: ${doc.date}\nContent: ${text}\n\nFormat:\n• Facts: (what happened, 1 sentence)\n• Held: (what court decided, 1-2 sentences)\n• Significance: (why this matters legally, 1 sentence)\n\nBe concise and accurate.`;

    // ✅ FIX: Use YOUR backend instead of external API
    const res = await fetch('/api/chat', {  // Change this line
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();

    const result = data?.reply || '';

    if (result) {
      setSummary(result);
    } else {
      setError(`No response from API. Response: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    setError(`Failed: ${e.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={generate} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 14px', borderRadius: 6, cursor: 'pointer',
        border: '1px solid #D97706', background: '#FFFBEB',
        color: '#92400E', fontSize: 12, fontWeight: 500,
      }}>
        <Sparkles size={13} />
        {loading ? 'Generating AI Summary…' : shown ? 'Hide AI Summary' : '✨ AI Headnote / Summary'}
      </button>

      {shown && (
        <div style={{
          marginTop: 10, padding: '14px 16px', borderRadius: 8,
          background: '#FFFBEB', border: '1px solid #FDE68A',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#92400E', marginBottom: 8 }}>
            AI-Generated Headnote
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontSize: 13 }}>
              <Loader2 size={14} className="animate-spin" /> Analysing judgement…
            </div>
          ) : error ? (
            <div style={{ fontSize: 12, color: '#DC2626' }}>{error}</div>
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#1C1917', whiteSpace: 'pre-line' }}>
              {summary}
            </div>
          )}
          <div style={{ fontSize: 10, color: '#92400E', opacity: 0.6, marginTop: 8 }}>
            AI-generated — verify with original judgement
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced Filter Panel
// ─────────────────────────────────────────────────────────────────────────────
const COURTS = [
  'Supreme Court of India','Delhi High Court','Bombay High Court',
  'Madras High Court','Calcutta High Court','Allahabad High Court',
  'Karnataka High Court','Gujarat High Court','Punjab & Haryana High Court',
  'Rajasthan High Court','Kerala High Court','Patna High Court',
  'Orissa High Court','Gauhati High Court','Uttarakhand High Court',
  'Madhya Pradesh High Court','Andhra Pradesh High Court','Telangana High Court',
  'Jharkhand High Court','Chhattisgarh High Court',
];
const SUBJECTS = [
  'Criminal Law','Constitutional Law','Civil Law','Family Law',
  'Property Law','Labour & Employment','Taxation','Banking & Finance',
  'Corporate & Commercial','Intellectual Property','Environmental Law',
  'Administrative Law','Service Law','Insurance','Arbitration',
  'Consumer Protection','Land Acquisition',
];
const YEARS = Array.from({ length: 40 }, (_, i) => String(2025 - i));
const QUICK_TAGS = [
  'anticipatory bail','section 498A','fundamental rights','article 21',
  'divorce maintenance','property dispute','income tax refund','habeas corpus',
  'writ of mandamus','contempt of court',
];

function AdvancedFilters({ onSearch, onClose }) {
  const [q, setQ]           = useState('');
  const [court, setCourt]   = useState('');
  const [year, setYear]     = useState('');
  const [subject, setSubject] = useState('');
  const [bench, setBench]   = useState('');

  const apply = () => {
    const parts = [q.trim(), subject.trim(), bench ? `bench "${bench}"` : ''].filter(Boolean);
    const query = parts.join(' ') || 'judgment';
    onSearch(query, { court, year });
    onClose();
  };

  const inp = { width: '100%', height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', fontSize: 12, color: '#111827', outline: 'none' };
  const sel = { ...inp, cursor: 'pointer' };

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
      marginTop: 4, background: '#FFFFFF', border: '1px solid #E5E7EB',
      borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' }}>
          Advanced Search
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {[
          ['Keywords', <input style={inp} value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. bail arrest section..." />],
          ['Court', <select style={sel} value={court} onChange={e => setCourt(e.target.value)}>
            <option value="">All Courts</option>
            {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>],
          ['Year', <select style={sel} value={year} onChange={e => setYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>],
          ['Subject', <select style={sel} value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>],
          ['Bench Type', <select style={sel} value={bench} onChange={e => setBench(e.target.value)}>
            <option value="">Any Bench</option>
            <option>Constitution Bench</option>
            <option>Larger Bench</option>
            <option>Division Bench</option>
            <option>Single Bench</option>
          </select>],
          ['', <button onClick={apply} style={{
            width: '100%', height: 32, background: '#B45309', border: 'none',
            borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Apply Filters</button>],
        ].map(([label, el], i) => (
          <div key={i}>
            {label && <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>}
            {el}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUICK_TAGS.map(tag => (
          <button key={tag} onClick={() => setQ(tag)} style={{
            height: 22, padding: '0 10px', borderRadius: 100,
            border: '1px solid #E5E7EB', background: '#F9FAFB',
            fontSize: 11, color: '#6B7280', cursor: 'pointer',
          }}>{tag}</button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Print / Save PDF
// ─────────────────────────────────────────────────────────────────────────────
function printJudgement(doc) {
  const win = window.open('', '_blank');
  if (!win) { alert('Allow popups to print/save as PDF'); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>${doc.title}</title>
    <style>
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#111;line-height:1.9;padding:0 24px}
      h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px}
      .meta{background:#f9f9f0;padding:12px 16px;border-radius:6px;font-size:13px;color:#444;margin-bottom:24px;border:1px solid #e5e5cc}
      .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
      .content{font-size:14px;line-height:1.9;color:#222}
      @media print{body{margin:10px}}
    </style></head><body>
    <h1>${doc.title}</h1>
    <div class="meta">
      ${doc.citation ? `<strong>${doc.citation}</strong><br>` : ''}
      <strong>Court:</strong> ${doc.court || 'N/A'} &nbsp;|&nbsp;
      <strong>Date:</strong> ${formatDate(doc.date) || 'N/A'}
    </div>
    ${doc.fulltext
      ? `<div class="label">Full Judgement</div><div class="content">${doc.fulltext}</div>`
      : doc.snippet
        ? `<div class="label">Excerpt</div><div class="content">${doc.snippet}</div>`
        : '<p style="color:#999">Full text not available.</p>'
    }
    </body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

// ─────────────────────────────────────────────────────────────────────────────
// Save to file (download as .txt)
// ─────────────────────────────────────────────────────────────────────────────
function saveToFile(doc) {
  const content = [
    doc.title,
    doc.citation ? `Citation: ${doc.citation}` : '',
    `Court: ${doc.court || 'N/A'}`,
    `Date: ${formatDate(doc.date) || 'N/A'}`,
    '',
    '--- JUDGEMENT ---',
    '',
    doc.fulltext
      ? doc.fulltext.replace(/<[^>]*>/g, '')
      : doc.snippet
        ? doc.snippet.replace(/<[^>]*>/g, '')
        : 'Full text not available.',
  ].filter(l => l !== undefined).join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${doc.title.slice(0, 60).replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Top tabs + Modules
// ─────────────────────────────────────────────────────────────────────────────
const TOP_TABS = [
  { id: 'judgements',  label: 'Judgements',  isLatest: true },
  { id: 'bare-acts',   label: 'Bare Acts',   query: 'bare act statute section India' },
  { id: 'legal-news',  label: 'Legal News',  query: 'latest supreme court order judgment 2025' },
  { id: 'law-reports', label: 'Law Reports', query: 'AIR SCC law report commission India' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Styles (light theme)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  pageBg    : '#F3F4F6',
  topbar    : '#1E293B',
  topbarBor : '#334155',
  white     : '#FFFFFF',
  border    : '#E5E7EB',
  borderMid : '#D1D5DB',
  text1     : '#111827',
  text2     : '#374151',
  text3     : '#6B7280',
  text4     : '#9CA3AF',
  gold      : '#B45309',
  goldLight : '#FEF3C7',
  goldBord  : '#FDE68A',
  accent    : '#1E40AF',
  listBg    : '#FFFFFF',
  listHover : '#F9FAFB',
  listSel   : '#FFFBEB',
  detailBg  : '#FFFFFF',
  sectionBg : '#F9FAFB',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const JudgementsPage = () => {
  const navigate = useNavigate();

  const {
    queryText, setQueryText,
    activeFilters, toggleFilter,
    selectedDocid, setSelectedDocid,
  } = useSearchContext();

  const [activeTab,    setActiveTab]    = useState('judgements');
  const [inputValue,   setInputValue]   = useState('');
  const [citationMode, setCitationMode] = useState(false);
  const [showAdv,      setShowAdv]      = useState(false);
  const [toast,        setToast]        = useState('');
  const [copied,       setCopied]       = useState(false);

  const { data: latestData, loading: latestLoading } = useLatestJudgements();
  const {
    results: searchData, loading: searchLoading,
    error: searchError, search,
    nextPage: searchNextPage, prevPage: searchPrevPage,
    page: searchPage,
  } = useSearch();
  const { data: docDetail, loading: docLoading } = useJudgement(selectedDocid);
  const { save, remove, isSaved } = useSaved();

  const isSearching = !!queryText;
  const listLoading = isSearching ? searchLoading : latestLoading;
  const listItems   = isSearching ? (searchData?.results || []) : (latestData?.results || []);

  useEffect(() => {
    if (listItems.length > 0 && !selectedDocid) setSelectedDocid(listItems[0].id);
  }, [listItems]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const doSearch = useCallback((q, filters = {}) => {
    if (!q?.trim()) return;
    setQueryText(q);
    setSelectedDocid(null);
    // Pass court and year through filters object
    search(q, 0, filters);
  }, [search, setQueryText]);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    setCitationMode(false);
    setShowAdv(false);
    doSearch(inputValue);
  };

  const handleTopTab = (tab) => {
    setActiveTab(tab.id);
    setSelectedDocid(null);
    if (tab.isLatest) { setQueryText(''); setInputValue(''); }
    else { setInputValue(tab.query); doSearch(tab.query); }
  };

  const handleSaveToggle = async () => {
    if (!docDetail) return;
    if (isSaved(docDetail.id)) {
      await remove(docDetail.id);
      showToast('Removed from saved');
    } else {
      await save({ docid: docDetail.id, title: docDetail.title, citation: docDetail.citation, court: docDetail.court, date: docDetail.date });
      showToast('Saved to library ✓');
    }
  };

  const copyCitation = () => {
    const text = [docDetail?.citation, docDetail?.title, `Court: ${docDetail?.court}`, `Date: ${formatDate(docDetail?.date)}`].filter(Boolean).join('\n');
    try {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const filterChips = [
    { id: 'landmark',       label: 'Landmark',       query: 'landmark judgment india' },
    { id: 'criminal',       label: 'Criminal',       query: 'criminal law IPC CrPC bail' },
    { id: 'constitutional', label: 'Constitutional', query: 'constitutional law fundamental rights' },
    { id: 'overruled',      label: 'Overruled',      query: 'overruled reversed judgment' },
  ];

  // Shared button styles
  const btnBase = { display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.pageBg, fontFamily: "'Inter', 'DM Sans', sans-serif", overflow: 'hidden' }}>

      {/* ── TOPBAR ────────────────────────────────────────────── */}
      <div style={{ height: 52, background: C.topbar, borderBottom: `1px solid ${C.topbarBor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#B45309', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚖</div>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#FEF3C7' }}>Talk N <span style={{ color: '#F59E0B' }}>Type</span></span>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          {TOP_TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTopTab(tab)} style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
              background: activeTab === tab.id ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#F59E0B' : 'rgba(255,255,255,0.55)',
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>
            Back
          </button>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1E293B', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#F59E0B' }}>AS</div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── SEARCH ─────────────────────────────────────────── */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0, position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 38, background: '#F9FAFB', border: `1px solid ${C.borderMid}`, borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
                <Search size={15} color={C.text4} style={{ flexShrink: 0 }} />
                <input
                  type="text" value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={citationMode ? 'Enter citation e.g. AIR 1973 SC 1461…' : 'Search by case name, party, citation, section, or keywords…'}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text1 }}
                />
                {searchLoading && <Loader2 size={14} color="#B45309" className="animate-spin" style={{ flexShrink: 0 }} />}
              </div>
              <button onClick={() => setShowAdv(v => !v)} style={{
                ...btnBase,
                background: showAdv ? C.goldLight : '#F9FAFB',
                borderColor: showAdv ? C.gold : C.borderMid,
                color: showAdv ? C.gold : C.text3,
              }}>
                Filters <ChevronDown size={12} style={{ transform: showAdv ? 'rotate(180deg)' : 'none' }} />
              </button>
              <button onClick={handleSearch} disabled={searchLoading} style={{
                ...btnBase, padding: '0 20px', background: C.gold, borderColor: C.gold,
                color: '#FFFFFF', fontWeight: 600, opacity: searchLoading ? 0.6 : 1,
              }}>
                {searchLoading ? 'Searching…' : 'Search'}
              </button>
            </div>

            {/* Quick filter chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: C.text4, marginRight: 2 }}>Quick:</span>
              {filterChips.map(({ id, label, query }) => {
                const active = activeFilters.includes(id);
                return (
                  <button key={id} onClick={() => { toggleFilter(id); setInputValue(query); doSearch(query); }} style={{
                    height: 24, padding: '0 10px', borderRadius: 100, cursor: 'pointer',
                    border: `1px solid ${active ? C.gold : C.border}`,
                    background: active ? C.goldLight : C.white,
                    color: active ? C.gold : C.text3, fontSize: 11, fontWeight: 500,
                  }}>{label}</button>
                );
              })}
              <button onClick={() => setCitationMode(v => !v)} style={{
                height: 24, padding: '0 10px', borderRadius: 100, cursor: 'pointer',
                border: `1px solid ${citationMode ? C.accent : C.border}`,
                background: citationMode ? '#EFF6FF' : C.white,
                color: citationMode ? C.accent : C.text3, fontSize: 11,
              }}>Citation Search</button>
            </div>

            {showAdv && <AdvancedFilters onSearch={(q, f) => { setInputValue(q); doSearch(q, f); }} onClose={() => setShowAdv(false)} />}
          </div>

          {/* ── SPLIT VIEW ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* LIST */}
            <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.listBg }}>
              <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: C.text3 }}>
                    {isSearching ? `"${queryText}"` : 'Recent Judgements'}
                  </span>
                </div>
                {searchData?.total && (
                  <span style={{ fontSize: 10, color: C.text4, background: C.border, padding: '2px 8px', borderRadius: 100 }}>
                    {String(searchData.total).includes('of') ? String(searchData.total).split('of')[1].trim() : searchData.total}+
                  </span>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {listLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 10 }}>
                    <Loader2 size={22} color="#B45309" className="animate-spin" />
                    <span style={{ fontSize: 12, color: C.text4 }}>Fetching from Indian Kanoon…</span>
                  </div>
                )}
                {searchError && !listLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8, color: '#DC2626', padding: 16, textAlign: 'center' }}>
                    <AlertCircle size={22} />
                    <span style={{ fontSize: 12 }}>{searchError}</span>
                  </div>
                )}
                {!listLoading && !searchError && listItems.map(item => (
                  <div key={item.id} onClick={() => setSelectedDocid(item.id)} style={{
                    padding: '12px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                    background: selectedDocid === item.id ? C.listSel : C.listBg,
                    borderLeft: selectedDocid === item.id ? '3px solid #B45309' : '3px solid transparent',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (selectedDocid !== item.id) e.currentTarget.style.background = C.listHover; }}
                  onMouseLeave={e => { if (selectedDocid !== item.id) e.currentTarget.style.background = C.listBg; }}
                  >
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#B45309', marginBottom: 4 }}>
                      {item.citation || `Doc #${item.id}`}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, marginBottom: 6, lineHeight: 1.4 }}>
                      {truncate(item.title, 70)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <CourtBadge courtName={item.court} />
                      <span style={{ fontSize: 10, color: C.text4, marginLeft: 'auto' }}>{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))}
                {!listLoading && !searchError && listItems.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8, color: C.text4 }}>
                    <FileText size={26} />
                    <span style={{ fontSize: 12 }}>No results found</span>
                    <span style={{ fontSize: 11, color: C.text4, opacity: 0.6 }}>Try different keywords</span>
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              {isSearching && listItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: `1px solid ${C.border}`, background: '#F9FAFB', flexShrink: 0 }}>
                  <button
                    onClick={() => { searchPrevPage(); setSelectedDocid(null); }}
                    disabled={!searchPage || searchLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: (!searchPage || searchLoading) ? 'not-allowed' : 'pointer', color: (!searchPage || searchLoading) ? C.text4 : C.gold, fontSize: 12, fontWeight: 500, opacity: (!searchPage || searchLoading) ? 0.4 : 1 }}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{ fontSize: 11, color: C.text3, background: C.border, padding: '3px 10px', borderRadius: 100 }}>
                    Page {(searchPage || 0) + 1}
                  </span>
                  <button
                    onClick={() => { searchNextPage(); setSelectedDocid(null); }}
                    disabled={searchLoading || listItems.length < 10}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: (searchLoading || listItems.length < 10) ? 'not-allowed' : 'pointer', color: (searchLoading || listItems.length < 10) ? C.text4 : C.gold, fontSize: 12, fontWeight: 500, opacity: (searchLoading || listItems.length < 10) ? 0.4 : 1 }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* DETAIL */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.detailBg }}>
              {docLoading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <Loader2 size={28} color="#B45309" className="animate-spin" />
                  <span style={{ fontSize: 13, color: C.text4 }}>Loading judgement…</span>
                </div>
              ) : docDetail ? (
                <>
                  {/* Header */}
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
                    {docDetail.citation && (
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gold, marginBottom: 6 }}>
                        {docDetail.citation}
                      </div>
                    )}
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.text1, marginBottom: 10, lineHeight: 1.35 }}>
                      {docDetail.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ height: 20, padding: '0 8px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, background: '#FEE2E2', color: '#991B1B' }}>
                        <Building2 size={10} /> {docDetail.court || 'N/A'}
                      </span>
                      {docDetail.date && (
                        <span style={{ height: 20, padding: '0 8px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: '#065F46' }}>
                          <Calendar size={10} /> {formatDate(docDetail.date)}
                        </span>
                      )}
                      {docDetail.bench && (
                        <span style={{ height: 20, padding: '0 8px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, background: '#F3F4F6', color: '#374151' }}>
                          <Users size={10} /> {truncate(docDetail.bench, 40)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* AI Headnote */}
                    <Headnote doc={docDetail} />

                    {/* Snippet */}
                    {docDetail.snippet && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.text4, paddingBottom: 6, borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
                          Summary / Excerpt
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.85, color: C.text2 }}
                          dangerouslySetInnerHTML={{ __html: docDetail.snippet }} />
                      </div>
                    )}

                    {/* Full text */}
                    {docDetail.fulltext ? (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.text4, paddingBottom: 6, borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
                          Full Judgement
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.95, color: C.text2 }}
                          dangerouslySetInnerHTML={{ __html: docDetail.fulltext }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 8, color: C.text4 }}>
                        <FileText size={28} />
                        <span style={{ fontSize: 13 }}>Full text not available inline</span>
                        <a href={`https://indiankanoon.org/doc/${docDetail.id}/`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: C.gold }}>
                          Read on Indian Kanoon →
                        </a>
                      </div>
                    )}

                    {/* Acts */}
                    {docDetail.acts?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.text4, paddingBottom: 6, borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
                          Provisions Cited
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {docDetail.acts.slice(0, 20).map((act, i) => (
                            <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#F3F4F6', border: `1px solid ${C.border}`, color: C.text2, fontFamily: 'monospace' }}>
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, flexShrink: 0, background: '#F9FAFB', alignItems: 'center' }}>
                    <button onClick={() => printJudgement(docDetail)} style={{ ...btnBase, background: C.gold, borderColor: C.gold, color: '#fff', fontWeight: 600 }}>
                      <Printer size={13} /> Print / PDF
                    </button>
                    <button onClick={() => saveToFile(docDetail)} style={{ ...btnBase, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E40AF' }}>
                      <FileText size={13} /> Save to File
                    </button>
                    <button onClick={copyCitation} style={{ ...btnBase, background: C.white, borderColor: C.borderMid, color: copied ? '#16A34A' : C.text2 }}>
                      <Copy size={13} /> {copied ? '✓ Copied!' : 'Copy Citation'}
                    </button>
                    <button onClick={handleSaveToggle} style={{
                      ...btnBase,
                      background: isSaved(docDetail.id) ? C.goldLight : C.white,
                      borderColor: isSaved(docDetail.id) ? C.gold : C.borderMid,
                      color: isSaved(docDetail.id) ? C.gold : C.text2,
                    }}>
                      <Bookmark size={13} fill={isSaved(docDetail.id) ? 'currentColor' : 'none'} />
                      {isSaved(docDetail.id) ? 'Saved ✓' : 'Save'}
                    </button>
                    <div style={{ flex: 1 }} />
                    <a href={`https://indiankanoon.org/doc/${docDetail.id}/`} target="_blank" rel="noreferrer"
                      style={{ ...btnBase, background: C.white, borderColor: C.borderMid, color: C.text3, textDecoration: 'none' }}>
                      <ExternalLink size={13} /> Indian Kanoon
                    </a>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: C.text4 }}>
                  <Gavel size={40} color={C.text4} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: 14 }}>Select a judgement to read</span>
                  <span style={{ fontSize: 12, color: C.text4, opacity: 0.6 }}>Click any case from the list</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: '#F59E0B', fontSize: 13, fontWeight: 500,
          padding: '8px 20px', borderRadius: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default JudgementsPage;