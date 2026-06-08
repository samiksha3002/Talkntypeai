// frontend/src/pages/JudgementsPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Bookmark, Building2, Calendar,
  Users, Gavel, Printer, Copy, ExternalLink,
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
  ChevronDown, X, Sparkles, BookOpen,
} from 'lucide-react';

import { useLatestJudgements, useSearch, useJudgement, useSaved } from '../components/Hooks/usejudgements';
import { useSearchContext } from '../components/Context/searchcontext.jsx';
import { formatDate, getCourtInfo, truncate } from '../components/utils/formatters';

// ── Court Badge ────────────────────────────────────────────────────────────────
function CourtBadge({ courtName }) {
  const { label, style } = getCourtInfo(courtName);
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style}`}>
      {label}
    </span>
  );
}

// ── AI Headnote using Gemini ───────────────────────────────────────────────────
function Headnote({ doc }) {
  const [summary, setSummary]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [shown,   setShown]     = useState(false);

  const generate = async () => {
    if (summary) { setShown(s => !s); return; }
    setLoading(true);
    setShown(true);
    try {
      const text = (doc.snippet || '') + ' ' + (doc.fulltext || '').slice(0, 2000);
      const res = await fetch('https://talkntypeai.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Legal case: "${doc.title}"\nCourt: ${doc.court}\nDate: ${doc.date}\n\nText: ${text}\n\nGive a headnote in exactly 3 bullet points:\n• Facts: (1 sentence)\n• Held: (1-2 sentences, key ratio decidendi)\n• Significance: (why this case matters)\n\nBe concise and legally accurate.`,
        }),
      });
      const data = await res.json();
      setSummary(data.reply || data.message || data.response || 'Summary not available.');
    } catch {
      setSummary('Could not generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={generate}
        className="flex items-center gap-2 h-8 px-4 rounded text-xs font-medium border border-yellow-600/40 text-yellow-500 bg-yellow-600/8 hover:bg-yellow-600/15 transition-colors"
      >
        <Sparkles size={13} />
        {loading ? 'Generating AI Summary…' : shown ? 'Hide AI Summary' : '✨ AI Headnote / Summary'}
      </button>

      {shown && (
        <div className="mt-3 p-4 rounded-lg border border-yellow-600/20 bg-yellow-600/5">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-500/80 mb-2">
            AI-Generated Headnote
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Loader2 size={14} className="animate-spin" /> Analysing judgement…
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">
              {summary}
            </div>
          )}
          <div className="text-[10px] text-white/25 mt-2">
            AI-generated summary — verify with original judgement
          </div>
        </div>
      )}
    </div>
  );
}

// ── Advanced Search Panel ──────────────────────────────────────────────────────
const COURTS = [
  'Supreme Court of India','Delhi High Court','Bombay High Court',
  'Madras High Court','Calcutta High Court','Allahabad High Court',
  'Karnataka High Court','Gujarat High Court','Punjab & Haryana High Court',
  'Rajasthan High Court','Kerala High Court','Patna High Court',
  'Orissa High Court','Gauhati High Court','Uttarakhand High Court',
  'Madhya Pradesh High Court','Andhra Pradesh High Court','Telangana High Court',
];
const SUBJECTS = [
  'Criminal Law','Constitutional Law','Civil Law','Family Law',
  'Property Law','Labour & Employment','Taxation','Banking & Finance',
  'Corporate & Commercial','Intellectual Property','Environmental Law',
  'Administrative Law','Service Law','Insurance','Arbitration',
  'Consumer Protection','Land Acquisition',
];
const YEARS = Array.from({ length: 40 }, (_, i) => String(2025 - i));

function AdvancedFilters({ onSearch, onClose }) {
  const [q,       setQ]       = useState('');
  const [court,   setCourt]   = useState('');
  const [year,    setYear]    = useState('');
  const [subject, setSubject] = useState('');
  const [bench,   setBench]   = useState('');

  const apply = () => {
    const parts = [q, subject].filter(Boolean);
    if (bench) parts.push(`bench:${bench}`);
    const query = parts.join(' ') || 'judgment';
    const filters = { court, year };
    onSearch(query, 0, filters);
    onClose();
  };

  const inputCls = "w-full h-8 px-3 rounded bg-slate-800 border border-slate-600 text-sm text-white/80 outline-none focus:border-yellow-600/50 placeholder-white/25";
  const selectCls = "w-full h-8 px-3 rounded bg-slate-800 border border-slate-600 text-sm text-white/70 outline-none focus:border-yellow-600/50";

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">Advanced Search</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/70"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Keywords</div>
          <input className={inputCls} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="e.g. bail anticipatory arrest" />
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Court</div>
          <select className={selectCls} value={court} onChange={e=>setCourt(e.target.value)}>
            <option value="">All Courts</option>
            {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Year</div>
          <select className={selectCls} value={year} onChange={e=>setYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Subject</div>
          <select className={selectCls} value={subject} onChange={e=>setSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Bench Type</div>
          <select className={selectCls} value={bench} onChange={e=>setBench(e.target.value)}>
            <option value="">Any Bench</option>
            <option value="Constitution Bench">Constitution Bench</option>
            <option value="Larger Bench">Larger Bench (5+)</option>
            <option value="Division Bench">Division Bench</option>
            <option value="Single Bench">Single Bench</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={apply}
            className="w-full h-8 px-4 bg-yellow-700 rounded text-xs font-semibold text-slate-900 hover:bg-yellow-600 transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['landmark','anticipatory bail','section 498A','fundamental rights',
          'article 21','divorce maintenance','property dispute','income tax'].map(tag => (
          <button key={tag} onClick={() => { setQ(tag); }}
            className="h-5 px-2 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-white/45 hover:text-yellow-500 hover:border-yellow-600/40 transition-colors">
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Print / PDF ────────────────────────────────────────────────────────────────
function printJudgement(doc) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${doc.title}</title>
    <style>
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#111;line-height:1.9;padding:0 24px}
      h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px}
      .meta{background:#f5f5f0;padding:12px 16px;border-radius:6px;font-size:13px;color:#444;margin-bottom:24px}
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

// ── Modules ────────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'latest-cases',      label: 'Latest Cases',      isLatest: true },
  { id: 'citation-search',   label: 'Citation Search',   isCitation: true },
  { id: 'advanced-search',   label: 'Advanced Search',   isAdvanced: true },
  { id: 'nominal-search',    label: 'Nominal Search',    query: '' },
  { id: 'subject-topic',     label: 'Subject / Topic',   query: 'subject matter law' },
  { id: 'judges-search',     label: 'Judges Search',     query: '' },
  { id: 'new-criminal-laws', label: 'New Criminal Laws', query: 'BNS BNSS BSA bharatiya nyaya sanhita 2023' },
  { id: 'central-laws',      label: 'Central Laws',      query: 'central act parliament India' },
  { id: 'state-laws',        label: 'State Laws',        query: 'state amendment act legislation' },
  { id: 'overruled-cases',   label: 'Overruled Cases',   query: 'overruled reversed judgment' },
  { id: 'law-comm-reports',  label: 'Law Comm. Reports', query: 'law commission report India' },
];

const TOP_TABS = [
  { id: 'judgements',  label: 'Judgements',  isLatest: true },
  { id: 'bare-acts',   label: 'Bare Acts',   query: 'bare act statute section India' },
  { id: 'legal-news',  label: 'Legal News',  query: 'latest supreme court judgment 2025' },
  { id: 'law-reports', label: 'Law Reports', query: 'AIR SCC law commission report' },
];

// ── Copy to clipboard helper ───────────────────────────────────────────────────
function useCopyToast() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };
  return { copied, copy };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const JudgementsPage = () => {
  const navigate = useNavigate();
  const { copied, copy } = useCopyToast();

  const {
    queryText, setQueryText,
    activeFilters, toggleFilter,
    activeModule, setActiveModule,
    selectedDocid, setSelectedDocid,
  } = useSearchContext();

  const [activeTab,     setActiveTab]     = useState('judgements');
  const [inputValue,    setInputValue]    = useState('');
  const [citationMode,  setCitationMode]  = useState(false);
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [savedToast,    setSavedToast]    = useState('');

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

  const doSearch = useCallback((q, page = 0, filters = {}) => {
    if (!q?.trim()) return;
    setQueryText(q);
    search(q, page, filters);
  }, [search, setQueryText]);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    setCitationMode(false);
    setShowAdvanced(false);
    setSelectedDocid(null);
    doSearch(inputValue, 0);
  };

  const handleTopTab = (tab) => {
    setActiveTab(tab.id);
    setSelectedDocid(null);
    if (tab.isLatest) { setQueryText(''); setInputValue(''); }
    else { setInputValue(tab.query); doSearch(tab.query, 0); }
  };

  const handleModuleClick = (mod) => {
    setActiveModule(mod.id);
    setSelectedDocid(null);
    setCitationMode(!!mod.isCitation);
    setShowAdvanced(!!mod.isAdvanced);
    if (mod.isLatest) { setQueryText(''); setInputValue(''); return; }
    if (mod.isCitation || mod.isAdvanced) { setInputValue(''); return; }
    if (mod.query) { setInputValue(mod.query); doSearch(mod.query, 0); }
  };

  const handleSaveToggle = async () => {
    if (!docDetail) return;
    if (isSaved(docDetail.id)) {
      await remove(docDetail.id);
      setSavedToast('Removed from library');
    } else {
      await save({ docid: docDetail.id, title: docDetail.title, citation: docDetail.citation, court: docDetail.court, date: docDetail.date });
      setSavedToast('Saved to library ✓');
    }
    setTimeout(() => setSavedToast(''), 2000);
  };

  const copyCitation = () => {
    const parts = [
      docDetail?.citation,
      docDetail?.title,
      docDetail?.court && `Court: ${docDetail.court}`,
      docDetail?.date && `Date: ${formatDate(docDetail.date)}`,
    ].filter(Boolean);
    copy(parts.join('\n'));
  };

  const filterChips = [
    { id: 'all-courts',     label: 'All Courts',     icon: Building2, query: null },
    { id: 'landmark',       label: 'Landmark',       icon: null,      query: 'landmark judgment supreme court' },
    { id: 'criminal',       label: 'Criminal',       icon: null,      query: 'criminal law IPC CrPC section' },
    { id: 'constitutional', label: 'Constitutional', icon: null,      query: 'constitutional law fundamental rights article' },
    { id: 'overruled',      label: 'Overruled',      icon: null,      query: 'overruled reversed judgment' },
    { id: 'bench',          label: 'Full Bench',     icon: Users,     query: 'full bench constitution bench' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans overflow-hidden">

      {/* TOPBAR */}
      <div className="h-12 bg-slate-900 border-b border-slate-700/60 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-yellow-700 rounded flex items-center justify-center text-sm">⚖</div>
          <span className="text-sm font-medium text-yellow-100">Talk N <span className="text-yellow-500">Type</span></span>
        </div>
        <div className="flex gap-0.5">
          {TOP_TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTopTab(tab)}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.id ? 'bg-yellow-600/15 text-yellow-400' : 'text-white/45 hover:text-white/75 hover:bg-white/5'
              }`}>{tab.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')}
            className="text-xs px-3 py-1.5 rounded bg-slate-800 text-white/60 hover:text-white/80 border border-slate-700 transition-colors">
            Back
          </button>
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-yellow-600/50 flex items-center justify-center text-xs font-medium text-yellow-400">AS</div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* SEARCH */}
          <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-950 flex-shrink-0 relative">
            <div className="flex gap-2 mb-2.5">
              <div className="flex-1 h-9 bg-slate-800/80 border border-slate-600/60 rounded flex items-center px-3 gap-2 focus-within:border-yellow-600/50 transition-colors">
                <Search size={14} className="text-white/30 flex-shrink-0" />
                <input type="text" value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={citationMode ? 'Enter citation e.g. AIR 1973 SC 1461 or (1978) 1 SCC 248…' : 'Search by case name, citation, subject or keywords…'}
                  className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 outline-none" />
                {searchLoading && <Loader2 size={14} className="text-yellow-500 animate-spin flex-shrink-0" />}
              </div>
              <button onClick={() => setShowAdvanced(v => !v)}
                className={`h-9 px-3 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${showAdvanced ? 'border-yellow-600/50 text-yellow-400 bg-yellow-600/10' : 'border-slate-600 text-white/50 hover:text-white/75 bg-slate-800/50'}`}>
                Filters <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={handleSearch} disabled={searchLoading}
                className="h-9 px-5 bg-yellow-700 rounded text-xs font-semibold text-slate-900 hover:bg-yellow-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                {searchLoading ? 'Searching…' : 'Search Database'}
              </button>
            </div>

            {/* Quick filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {filterChips.map(({ id, label, icon: Icon, query }) => {
                const isActive = activeFilters.includes(id);
                return (
                  <button key={id}
                    onClick={() => { toggleFilter(id); if (query) { setInputValue(query); doSearch(query, 0); } }}
                    className={`h-6 px-3 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                      isActive ? 'border border-yellow-600/50 text-yellow-400 bg-yellow-600/10' : 'border border-slate-700 text-white/45 bg-slate-900 hover:border-slate-500 hover:text-white/65'
                    }`}>
                    {Icon && <Icon size={11} />}{label}
                  </button>
                );
              })}
            </div>

            {/* Advanced filters panel */}
            {showAdvanced && (
              <AdvancedFilters
                onSearch={(q, page, filters) => { doSearch(q, page, filters); setQueryText(q); }}
                onClose={() => setShowAdvanced(false)}
              />
            )}
          </div>

          {/* SPLIT VIEW */}
          <div className="flex flex-1 overflow-hidden">

            {/* LIST */}
            <div className="w-80 flex-shrink-0 border-r border-slate-700/60 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0 bg-slate-900/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs text-white/60 font-medium">
                    {isSearching ? `"${queryText}"` : 'Recent Judgements'}
                  </span>
                </div>
                {searchData?.total && (
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {String(searchData.total).includes('of')
                      ? String(searchData.total).split('of')[1].trim()
                      : searchData.total}+
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {listLoading && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2">
                    <Loader2 size={22} className="animate-spin text-yellow-600" />
                    <span className="text-xs text-white/30">Fetching from Indian Kanoon…</span>
                  </div>
                )}
                {searchError && !listLoading && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-red-400/80 px-4 text-center">
                    <AlertCircle size={22} />
                    <span className="text-xs">{searchError}</span>
                  </div>
                )}
                {!listLoading && !searchError && listItems.map(item => (
                  <div key={item.id} onClick={() => setSelectedDocid(item.id)}
                    className={`px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-all ${
                      selectedDocid === item.id ? 'bg-yellow-600/8 border-l-2 border-l-yellow-500' : 'hover:bg-white/[0.03]'
                    }`}>
                    <div className="text-[10px] font-mono text-yellow-500/70 mb-1">
                      {item.citation || `Doc #${item.id}`}
                    </div>
                    <div className="text-sm font-medium text-slate-200 mb-1.5 leading-snug">
                      {truncate(item.title, 75)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CourtBadge courtName={item.court} />
                      <span className="text-[10px] text-white/30 ml-auto">{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))}
                {!listLoading && !searchError && listItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-white/20">
                    <FileText size={26} />
                    <span className="text-xs">No results found</span>
                    <span className="text-[10px] text-white/15">Try different keywords</span>
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              {isSearching && listItems.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-700/60 bg-slate-900/40 flex-shrink-0">
                  <button onClick={() => { searchPrevPage(); setSelectedDocid(null); }}
                    disabled={!searchPage || searchLoading}
                    className="flex items-center gap-1 text-xs text-white/45 hover:text-yellow-400 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-[11px] text-white/30 bg-white/5 px-2.5 py-1 rounded-full">
                    Page {(searchPage || 0) + 1}
                  </span>
                  <button onClick={() => { searchNextPage(); setSelectedDocid(null); }}
                    disabled={searchLoading || listItems.length < 10}
                    className="flex items-center gap-1 text-xs text-white/45 hover:text-yellow-400 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* DETAIL */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {docLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={28} className="animate-spin text-yellow-600" />
                  <span className="text-xs text-white/30">Loading judgement…</span>
                </div>
              ) : docDetail ? (
                <>
                  {/* Detail header */}
                  <div className="px-5 py-4 border-b border-slate-700/60 flex-shrink-0">
                    {docDetail.citation && (
                      <div className="text-[10px] font-mono text-yellow-500/80 mb-1.5 tracking-wide">
                        {docDetail.citation}
                      </div>
                    )}
                    <div className="text-base font-semibold text-white mb-2.5 leading-snug">
                      {docDetail.title}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-red-900/30 text-red-300">
                        <Building2 size={10} /> {docDetail.court || 'N/A'}
                      </span>
                      {docDetail.date && (
                        <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-emerald-900/25 text-emerald-300">
                          <Calendar size={10} /> {formatDate(docDetail.date)}
                        </span>
                      )}
                      {docDetail.bench && (
                        <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-slate-700/60 text-slate-300">
                          <Users size={10} /> {truncate(docDetail.bench, 40)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail body */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

                    {/* AI Headnote button */}
                    <Headnote doc={docDetail} />

                    {/* Snippet */}
                    {docDetail.snippet && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-500/70 pb-2 border-b border-yellow-600/10 mb-3">
                          Summary / Excerpt
                        </div>
                        <div className="text-sm leading-relaxed text-slate-300"
                          dangerouslySetInnerHTML={{ __html: docDetail.snippet }} />
                      </div>
                    )}

                    {/* Full text */}
                    {docDetail.fulltext ? (
                      <div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-500/70 pb-2 border-b border-yellow-600/10 mb-3">
                          Full Judgement
                        </div>
                        <div className="text-sm leading-relaxed text-slate-300"
                          dangerouslySetInnerHTML={{ __html: docDetail.fulltext }} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/20">
                        <FileText size={28} />
                        <span className="text-xs">Full text not available inline</span>
                        <a href={`https://indiankanoon.org/doc/${docDetail.id}/`}
                          target="_blank" rel="noreferrer"
                          className="text-[11px] text-yellow-500/60 hover:text-yellow-400 underline">
                          Read full judgement on Indian Kanoon →
                        </a>
                      </div>
                    )}

                    {/* Acts cited */}
                    {docDetail.acts?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-500/70 pb-2 border-b border-yellow-600/10 mb-3">
                          Provisions / Acts Cited
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {docDetail.acts.slice(0, 20).map((act, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-slate-700/60 flex gap-2 flex-shrink-0 bg-slate-900/80 items-center">
                    <button onClick={() => printJudgement(docDetail)}
                      className="h-8 px-4 bg-yellow-700 rounded text-xs font-semibold text-slate-900 hover:bg-yellow-600 transition-colors flex items-center gap-1.5">
                      <Printer size={13} /> Print / PDF
                    </button>

                    <button onClick={copyCitation}
                      className="h-8 px-3 bg-transparent border border-slate-600 rounded text-xs text-slate-300 hover:text-white hover:border-slate-400 transition-colors flex items-center gap-1.5">
                      <Copy size={13} />
                      {copied ? '✓ Copied!' : 'Copy Citation'}
                    </button>

                    <button onClick={handleSaveToggle}
                      className={`h-8 px-3 border rounded text-xs transition-colors flex items-center gap-1.5 ${
                        isSaved(docDetail.id)
                          ? 'border-yellow-600/60 text-yellow-400 bg-yellow-600/10'
                          : 'bg-transparent border-slate-600 text-slate-300 hover:text-white hover:border-slate-400'
                      }`}>
                      <Bookmark size={13} fill={isSaved(docDetail.id) ? 'currentColor' : 'none'} />
                      {savedToast || (isSaved(docDetail.id) ? 'Saved ✓' : 'Save')}
                    </button>

                    <div className="flex-1" />

                    <a href={`https://indiankanoon.org/doc/${docDetail.id}/`}
                      target="_blank" rel="noreferrer"
                      className="h-8 px-3 bg-transparent border border-slate-600 rounded text-xs text-slate-300 hover:text-white hover:border-slate-400 transition-colors flex items-center gap-1.5">
                      <ExternalLink size={13} /> Indian Kanoon
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/15">
                  <Gavel size={36} />
                  <span className="text-sm">Select a judgement to read</span>
                  <span className="text-[11px] text-white/10">Click any case from the list on the left</span>
                </div>
              )}
            </div>
          </div>

          {/* MODULE BAR */}
          <div className="h-11 bg-slate-900 border-t border-slate-700/60 flex items-center gap-1 px-4 overflow-x-auto flex-shrink-0">
            {MODULES.map(mod => (
              <button key={mod.id} onClick={() => handleModuleClick(mod)}
                className={`h-7 px-3 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  activeModule === mod.id
                    ? 'bg-yellow-600/15 text-yellow-400'
                    : 'bg-white/4 text-white/40 hover:text-white/70 hover:bg-white/7'
                }`}>
                {mod.isLatest && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" />}
                {mod.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Toast notification */}
      {savedToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-slate-800 border border-yellow-600/30 text-yellow-400 text-xs px-4 py-2 rounded-full shadow-lg z-50">
          {savedToast}
        </div>
      )}
    </div>
  );
};

export default JudgementsPage;