// frontend/src/pages/JudgementsPage.jsx
//
// The original UI component — now wired to real API data via hooks.
// All dummy data removed; replaced with live data from Indian Kanoon via backend.
//

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Star, FileText, User, Bookmark, Clock,
  Building2, Calendar, Tag, Users, Gavel,
  Download, Copy, ExternalLink, Loader2, AlertCircle,
} from 'lucide-react';

import { useLatestJudgements, useSearch, useJudgement, useSaved } from '../components/Hooks/usejudgements';
import { useSearchContext } from '../components/Context/searchcontext.jsx';
import { formatDate, getCourtInfo, getTagStyle, truncate } from '../components/utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function TagBadge({ label }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getTagStyle(label)}`}>
      {label}
    </span>
  );
}

function CourtBadge({ courtName }) {
  const { label, style } = getCourtInfo(courtName);
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const JudgementsPage = () => {
  const navigate = useNavigate();

  const {
    queryText, setQueryText,
    activeFilters, toggleFilter,
    activeModule, setActiveModule,
    activeSideIcon, setActiveSideIcon,
    selectedDocid, setSelectedDocid,
  } = useSearchContext();

  const [activeTab, setActiveTab]     = useState('judgements');
  const [inputValue, setInputValue]   = useState(queryText);

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { data: latestData, loading: latestLoading } = useLatestJudgements();
  const { results: searchData, loading: searchLoading, error: searchError, search } = useSearch();
  const { data: docDetail, loading: docLoading } = useJudgement(selectedDocid);
  const { save, remove, isSaved } = useSaved();

  // Determine which list to show
  const isSearching    = !!queryText;
  const listLoading    = isSearching ? searchLoading : latestLoading;
  const listItems      = isSearching
    ? (searchData?.results || [])
    : (latestData?.results || []);

  // Auto-select first item when list changes
  useEffect(() => {
    if (listItems.length > 0 && !selectedDocid) {
      setSelectedDocid(listItems[0].id);
    }
  }, [listItems, selectedDocid, setSelectedDocid]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!inputValue.trim()) return;
    setQueryText(inputValue);
    search(inputValue, 0, buildFilters());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const buildFilters = () => {
    // Map active filter chips to IK API params
    const f = {};
    if (activeFilters.includes('sc-only')) f.court = 'Supreme Court of India';
    return f;
  };

  const handleSaveToggle = async () => {
    if (!docDetail) return;
    if (isSaved(docDetail.id)) {
      await remove(docDetail.id);
    } else {
      await save({
        docid:    docDetail.id,
        title:    docDetail.title,
        citation: docDetail.citation,
        court:    docDetail.court,
        date:     docDetail.date,
      });
    }
  };

  const copyCitation = () => {
    if (docDetail?.citation) {
      navigator.clipboard.writeText(docDetail.citation).catch(() => {});
    }
  };

  // ── Static UI data ──────────────────────────────────────────────────────────
  const topTabs    = ['Judgements', 'Bare Acts', 'Legal News', 'Law Reports'];
  const sideIcons  = [
    { id: 'latest',   icon: Star,     title: 'Latest'   },
    { id: 'search',   icon: Search,   title: 'Search'   },
    { id: 'citation', icon: FileText, title: 'Citation' },
    { id: 'judge',    icon: User,     title: 'By Judge' },
    { id: 'saved',    icon: Bookmark, title: 'Saved'    },
    { id: 'history',  icon: Clock,    title: 'History'  },
  ];
  const filterChips = [
    { id: 'all-courts',     label: 'All Courts',     icon: Building2 },
    { id: 'year',           label: 'Year',           icon: Calendar  },
    { id: 'subject',        label: 'Subject',        icon: Tag       },
    { id: 'bench',          label: 'Bench',          icon: Users     },
    { id: 'landmark',       label: 'Landmark'   },
    { id: 'criminal',       label: 'Criminal'   },
    { id: 'constitutional', label: 'Constitutional' },
    { id: 'overruled',      label: 'Overruled'  },
  ];
  const moduleButtons = [
    'Latest Cases','Citation Search','Advanced Search','Nominal Search',
    'Subject / Topic','Judges Search','New Criminal Laws','Central Laws',
    'State Laws','Overruled Cases','Law Comm. Reports',
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans border border-slate-700 rounded-lg overflow-hidden">

      {/* TOPBAR */}
      <div className="h-13 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-yellow-700 rounded flex items-center justify-center text-sm">⚖</div>
          <div className="text-sm font-medium text-yellow-100 tracking-wider">
            Talk N<span className="text-yellow-600"> Type</span>
          </div>
        </div>

        <div className="flex gap-0.5">
          {topTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'bg-yellow-600/10 text-yellow-600'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs font-medium px-3 py-1.5 rounded bg-slate-800 text-white/60 hover:text-white/80 transition-colors border border-slate-600"
          >
            Back
          </button>
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-yellow-600 flex items-center justify-center text-xs font-medium text-yellow-600">
            AS
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
       

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* SEARCH AREA */}
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-950 flex-shrink-0">
            <div className="flex gap-2 mb-2.5">
              <div className="flex-1 h-9 bg-slate-900 border border-slate-600 rounded flex items-center px-3 gap-2">
                <Search size={14} className="text-white/30" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by case name, citation, subject or keywords…"
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none"
                />
                {searchLoading && <Loader2 size={14} className="text-yellow-600 animate-spin flex-shrink-0" />}
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="h-9 px-4 bg-yellow-700 border-none rounded text-xs font-medium text-slate-900 hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                Search Database
              </button>
            </div>

            {/* FILTER CHIPS */}
            <div className="flex gap-1.5 flex-wrap">
              {filterChips.map(({ id, label, icon: Icon }) => {
                const isActive = activeFilters.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleFilter(id)}
                    className={`h-6 px-3 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      isActive
                        ? 'border border-yellow-600/50 text-yellow-600 bg-yellow-600/8'
                        : 'border border-slate-700 text-white/45 bg-slate-900'
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPLIT VIEW */}
          <div className="flex flex-1 overflow-hidden">

            {/* LIST COLUMN */}
            <div className="w-80 flex-shrink-0 border-r border-slate-700 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
                  <span className="text-xs font-medium text-white/70">
                    {isSearching ? `Results for "${queryText}"` : 'Recent Judgements'}
                  </span>
                </div>
                {searchData?.total != null && (
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {searchData.total.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Loading state */}
                {listLoading && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/30">
                    <Loader2 size={20} className="animate-spin text-yellow-600" />
                    <span className="text-xs">Loading judgements…</span>
                  </div>
                )}

                {/* Error state */}
                {searchError && !listLoading && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-red-400 px-4 text-center">
                    <AlertCircle size={20} />
                    <span className="text-xs">{searchError}</span>
                  </div>
                )}

                {/* Results */}
                {!listLoading && listItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDocid(item.id)}
                    className={`px-4 py-3 border-b border-white/4 cursor-pointer transition-colors ${
                      selectedDocid === item.id
                        ? 'bg-yellow-600/8 border-l-2 border-l-yellow-600'
                        : 'hover:bg-yellow-600/4'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-yellow-600 mb-1 leading-tight">
                      {item.citation || `Doc #${item.id}`}
                    </div>
                    <div className="text-sm font-medium text-yellow-50 mb-1.5 leading-snug">
                      {truncate(item.title, 80)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CourtBadge courtName={item.court} />
                      <span className="text-[10px] text-white/30 ml-auto">{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {!listLoading && !searchError && listItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/25">
                    <FileText size={20} />
                    <span className="text-xs">No results found</span>
                  </div>
                )}
              </div>
            </div>

            {/* DETAIL COLUMN */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {docLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-yellow-600" />
                </div>
              ) : docDetail ? (
                <>
                  {/* Detail header */}
                  <div className="px-5 py-3.5 border-b border-slate-700 flex-shrink-0">
                    <div className="text-[10px] font-mono text-yellow-600 mb-1.5">
                      {docDetail.citation}
                    </div>
                    <div className="text-base font-medium text-yellow-50 mb-2.5 leading-tight">
                      {docDetail.title}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-red-950/25 text-red-300">
                        <Building2 size={11} /> {docDetail.court || 'Court not specified'}
                      </span>
                      <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-green-950/20 text-green-300">
                        <Calendar size={11} /> {formatDate(docDetail.date)}
                      </span>
                    </div>
                  </div>

                  {/* Detail body */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                    {docDetail.snippet && (
                      <div>
                        <div className="text-[10px] font-medium tracking-widest uppercase text-yellow-600 pb-2 border-b border-yellow-600/12 mb-2.5">
                          Summary / Excerpt
                        </div>
                        <div
                          className="text-sm leading-relaxed text-white/55"
                          dangerouslySetInnerHTML={{ __html: docDetail.snippet }}
                        />
                      </div>
                    )}

                    {docDetail.fulltext && (
                      <div>
                        <div className="text-[10px] font-medium tracking-widest uppercase text-yellow-600 pb-2 border-b border-yellow-600/12 mb-2.5">
                          Full Judgement
                        </div>
                        <div
                          className="text-sm leading-relaxed text-white/55 prose-ik"
                          dangerouslySetInnerHTML={{ __html: docDetail.fulltext }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Detail footer */}
                  <div className="px-5 py-3 border-t border-slate-700 flex gap-2 flex-shrink-0 bg-slate-900">
                    <a
                      href={`https://indiankanoon.org/doc/${docDetail.id}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-4 bg-yellow-700 border-none rounded text-xs font-medium text-slate-900 hover:bg-yellow-600 transition-colors flex items-center gap-1"
                    >
                      <Download size={13} /> Download PDF
                    </a>
                    <button
                      onClick={copyCitation}
                      className="h-8 px-3.5 bg-transparent border border-slate-600 rounded text-xs text-white/55 hover:text-white/70 transition-colors flex items-center gap-1"
                    >
                      <Copy size={13} /> Copy Citation
                    </button>
                    <button
                      onClick={handleSaveToggle}
                      className={`h-8 px-3.5 border rounded text-xs transition-colors flex items-center gap-1 ${
                        isSaved(docDetail.id)
                          ? 'border-yellow-600/50 text-yellow-600 bg-yellow-600/8'
                          : 'bg-transparent border-slate-600 text-white/55 hover:text-white/70'
                      }`}
                    >
                      <Bookmark size={13} fill={isSaved(docDetail.id) ? 'currentColor' : 'none'} />
                      {isSaved(docDetail.id) ? 'Saved' : 'Save'}
                    </button>
                    <div className="flex-1" />
                    <a
                      href={`https://indiankanoon.org/doc/${docDetail.id}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-3.5 bg-transparent border border-slate-600 rounded text-xs text-white/55 hover:text-white/70 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={13} /> Indian Kanoon
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/20">
                  <Gavel size={32} />
                  <span className="text-sm">Select a judgement to view details</span>
                </div>
              )}
            </div>
          </div>

          {/* MODULE BAR */}
          <div className="h-11 bg-slate-900 border-t border-slate-700 flex items-center gap-1 px-4 overflow-x-auto flex-shrink-0">
            {moduleButtons.map((btn, index) => (
              <button
                key={index}
                onClick={() => setActiveModule(btn.toLowerCase().replace(/\s+/g, '-'))}
                className={`h-7 px-3 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  activeModule === btn.toLowerCase().replace(/\s+/g, '-')
                    ? 'bg-yellow-600/12 text-yellow-600'
                    : 'bg-white/4 text-white/45 hover:text-white/60'
                }`}
              >
                {index === 0 && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1 align-middle"></span>
                )}
                {btn}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JudgementsPage;// frontend/src/pages/JudgementsPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Bookmark,
  Building2, Calendar, Users, Gavel,
  Printer, Copy, ExternalLink, Loader2, AlertCircle,
  ChevronLeft, ChevronRight,
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

// ── Module config — each triggers a specific IK search ────────────────────────
const MODULES = [
  { id: 'latest-cases',      label: 'Latest Cases',       isLatest: true },
  { id: 'citation-search',   label: 'Citation Search',    isCitation: true },
  { id: 'advanced-search',   label: 'Advanced Search',    query: 'judgment' },
  { id: 'nominal-search',    label: 'Nominal Search',     query: '' },
  { id: 'subject-topic',     label: 'Subject / Topic',    query: 'subject matter law' },
  { id: 'judges-search',     label: 'Judges Search',      query: '' },
  { id: 'new-criminal-laws', label: 'New Criminal Laws',  query: 'BNS BNSS BSA bharatiya nyaya sanhita 2023' },
  { id: 'central-laws',      label: 'Central Laws',       query: 'central act parliament India' },
  { id: 'state-laws',        label: 'State Laws',         query: 'state amendment act legislation' },
  { id: 'overruled-cases',   label: 'Overruled Cases',    query: 'overruled reversed judgment' },
  { id: 'law-comm-reports',  label: 'Law Comm. Reports',  query: 'law commission report India' },
];

// ── Top tabs ───────────────────────────────────────────────────────────────────
const TOP_TABS = [
  { id: 'judgements',  label: 'Judgements',  isLatest: true },
  { id: 'bare-acts',   label: 'Bare Acts',   query: 'bare act statute section' },
  { id: 'legal-news',  label: 'Legal News',  query: 'latest supreme court judgment 2025' },
  { id: 'law-reports', label: 'Law Reports', query: 'AIR SCC law commission report' },
];

// ── Print / Save as PDF ────────────────────────────────────────────────────────
function printJudgement(doc) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>${doc.title}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; color: #111; line-height: 1.8; padding: 0 20px; }
          h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
          .meta { color: #555; font-size: 13px; margin-bottom: 24px; background: #f9f9f9; padding: 10px 14px; border-radius: 6px; }
          .section-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin: 24px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
          .content { font-size: 14px; line-height: 1.9; }
          @media print { body { margin: 10px; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${doc.title}</h1>
        <div class="meta">
          ${doc.citation ? `<strong>${doc.citation}</strong><br>` : ''}
          <strong>Court:</strong> ${doc.court || 'N/A'} &nbsp;|&nbsp;
          <strong>Date:</strong> ${formatDate(doc.date) || 'N/A'}
        </div>
        ${doc.fulltext
          ? `<div class="section-label">Full Judgement</div><div class="content">${doc.fulltext}</div>`
          : doc.snippet
            ? `<div class="section-label">Summary / Excerpt</div><div class="content">${doc.snippet}</div>`
            : '<p style="color:#999">Full text not available. Visit Indian Kanoon for complete judgement.</p>'
        }
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 600);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const JudgementsPage = () => {
  const navigate = useNavigate();

  const {
    queryText, setQueryText,
    activeFilters, toggleFilter,
    activeModule, setActiveModule,
    selectedDocid, setSelectedDocid,
  } = useSearchContext();

  const [activeTab,    setActiveTab]    = useState('judgements');
  const [inputValue,   setInputValue]   = useState('');
  const [citationMode, setCitationMode] = useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { data: latestData, loading: latestLoading } = useLatestJudgements();
  const {
    results: searchData,
    loading: searchLoading,
    error: searchError,
    search,
    nextPage: searchNextPage,
    prevPage: searchPrevPage,
    page: searchPage,
  } = useSearch();
  const { data: docDetail, loading: docLoading } = useJudgement(selectedDocid);
  const { save, remove, isSaved } = useSaved();

  const isSearching = !!queryText;
  const listLoading = isSearching ? searchLoading : latestLoading;
  const listItems   = isSearching
    ? (searchData?.results || [])
    : (latestData?.results || []);

  // Auto-select first result
  useEffect(() => {
    if (listItems.length > 0 && !selectedDocid) {
      setSelectedDocid(listItems[0].id);
    }
  }, [listItems]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const doSearch = useCallback((q, page = 0) => {
    if (!q?.trim()) return;
    setQueryText(q);
    search(q, page, {});
  }, [search, setQueryText]);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    setCitationMode(false);
    setSelectedDocid(null);
    doSearch(inputValue, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Top tab click
  const handleTopTab = (tab) => {
    setActiveTab(tab.id);
    setSelectedDocid(null);
    setActiveModule(tab.id);
    if (tab.isLatest) {
      setQueryText('');
      setInputValue('');
    } else {
      setInputValue(tab.query);
      doSearch(tab.query, 0);
    }
  };

  // Module bar click
  const handleModuleClick = (mod) => {
    setActiveModule(mod.id);
    setSelectedDocid(null);
    setCitationMode(!!mod.isCitation);

    if (mod.isLatest) {
      setQueryText('');
      setInputValue('');
      return;
    }
    if (mod.isCitation) {
      setInputValue('');
      setQueryText('');
      return;
    }
    if (mod.query) {
      setInputValue(mod.query);
      doSearch(mod.query, 0);
    }
  };

  // Pagination
  const handleNext = () => { searchNextPage(); setSelectedDocid(null); };
  const handlePrev = () => { searchPrevPage(); setSelectedDocid(null); };

  // Save toggle
  const handleSaveToggle = async () => {
    if (!docDetail) return;
    isSaved(docDetail.id)
      ? await remove(docDetail.id)
      : await save({ docid: docDetail.id, title: docDetail.title, citation: docDetail.citation, court: docDetail.court, date: docDetail.date });
  };

  const copyCitation = () => {
    const text = [docDetail?.citation, docDetail?.title, `Court: ${docDetail?.court}`, `Date: ${formatDate(docDetail?.date)}`].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const filterChips = [
    { id: 'all-courts',     label: 'All Courts',     icon: Building2 },
    { id: 'year',           label: 'Year',           icon: null },
    { id: 'subject',        label: 'Subject',        icon: null },
    { id: 'bench',          label: 'Bench',          icon: Users },
    { id: 'landmark',       label: 'Landmark',       query: 'landmark judgment' },
    { id: 'criminal',       label: 'Criminal',       query: 'criminal law IPC CrPC' },
    { id: 'constitutional', label: 'Constitutional', query: 'constitutional law fundamental rights' },
    { id: 'overruled',      label: 'Overruled',      query: 'overruled reversed' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans overflow-hidden">

      {/* TOPBAR */}
      <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-yellow-700 rounded flex items-center justify-center text-sm">⚖</div>
          <span className="text-sm font-medium text-yellow-100">
            Talk N <span className="text-yellow-500">Type</span>
          </span>
        </div>

        {/* Clickable top tabs */}
        <div className="flex gap-0.5">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTopTab(tab)}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-yellow-600/15 text-yellow-500'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs px-3 py-1.5 rounded bg-slate-800 text-white/60 hover:text-white/80 border border-slate-700 transition-colors"
          >
            Back
          </button>
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-yellow-600/60 flex items-center justify-center text-xs font-medium text-yellow-500">
            AS
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* SEARCH */}
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-950 flex-shrink-0">
            <div className="flex gap-2 mb-2.5">
              <div className="flex-1 h-9 bg-slate-900 border border-slate-700 rounded flex items-center px-3 gap-2 focus-within:border-yellow-600/40 transition-colors">
                <Search size={14} className="text-white/30 flex-shrink-0" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={citationMode ? 'Enter citation e.g. AIR 1973 SC 1461…' : 'Search by case name, citation, subject or keywords…'}
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none"
                />
                {searchLoading && <Loader2 size={14} className="text-yellow-600 animate-spin flex-shrink-0" />}
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="h-9 px-5 bg-yellow-700 rounded text-xs font-semibold text-slate-900 hover:bg-yellow-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {searchLoading ? 'Searching…' : 'Search Database'}
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {filterChips.map(({ id, label, icon: Icon, query }) => {
                const isActive = activeFilters.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => {
                      toggleFilter(id);
                      if (query) { setInputValue(query); doSearch(query, 0); }
                    }}
                    className={`h-6 px-3 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                      isActive
                        ? 'border border-yellow-600/50 text-yellow-500 bg-yellow-600/10'
                        : 'border border-slate-700 text-white/40 bg-slate-900 hover:border-slate-600 hover:text-white/60'
                    }`}
                  >
                    {Icon && <Icon size={11} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPLIT VIEW */}
          <div className="flex flex-1 overflow-hidden">

            {/* LIST */}
            <div className="w-80 flex-shrink-0 border-r border-slate-700 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between flex-shrink-0 bg-slate-900/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs text-white/60">
                    {isSearching ? `"${queryText}"` : 'Recent Judgements'}
                  </span>
                </div>
                {searchData?.total && (
                  <span className="text-[10px] text-white/25 bg-white/5 px-2 py-0.5 rounded-full">
                    {String(searchData.total).includes('of')
                      ? String(searchData.total).split('of')[1].trim()
                      : searchData.total}
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
                {!listLoading && !searchError && listItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDocid(item.id)}
                    className={`px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-all ${
                      selectedDocid === item.id
                        ? 'bg-yellow-600/8 border-l-2 border-l-yellow-500'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-yellow-600/70 mb-1">
                      {item.citation || `Doc #${item.id}`}
                    </div>
                    <div className="text-sm font-medium text-yellow-50/85 mb-1.5 leading-snug">
                      {truncate(item.title, 75)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CourtBadge courtName={item.court} />
                      <span className="text-[10px] text-white/25 ml-auto">{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))}
                {!listLoading && !searchError && listItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-white/20">
                    <FileText size={26} />
                    <span className="text-xs">No results found</span>
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              {isSearching && listItems.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-700 bg-slate-900/40 flex-shrink-0">
                  <button
                    onClick={handlePrev}
                    disabled={!searchPage || searchLoading}
                    className="flex items-center gap-1 text-xs text-white/45 hover:text-yellow-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-[11px] text-white/30 bg-white/5 px-2.5 py-1 rounded-full">
                    Page {(searchPage || 0) + 1}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={searchLoading || listItems.length < 10}
                    className="flex items-center gap-1 text-xs text-white/45 hover:text-yellow-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
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
                  <div className="px-5 py-4 border-b border-slate-700 flex-shrink-0">
                    {docDetail.citation && (
                      <div className="text-[10px] font-mono text-yellow-500/75 mb-1.5 tracking-wide">
                        {docDetail.citation}
                      </div>
                    )}
                    <div className="text-base font-semibold text-yellow-50 mb-2.5 leading-snug">
                      {docDetail.title}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-red-950/30 text-red-300/75">
                        <Building2 size={10} /> {docDetail.court || 'N/A'}
                      </span>
                      {docDetail.date && (
                        <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-green-950/25 text-green-300/75">
                          <Calendar size={10} /> {formatDate(docDetail.date)}
                        </span>
                      )}
                      {docDetail.bench && (
                        <span className="h-5 px-2.5 rounded text-xs flex items-center gap-1 bg-slate-800 text-white/35">
                          <Users size={10} /> {truncate(docDetail.bench, 35)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
                    {docDetail.snippet && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600/60 pb-2 border-b border-yellow-600/10 mb-3">
                          Summary / Excerpt
                        </div>
                        <div className="text-sm leading-relaxed text-white/55"
                          dangerouslySetInnerHTML={{ __html: docDetail.snippet }} />
                      </div>
                    )}
                    {docDetail.fulltext ? (
                      <div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600/60 pb-2 border-b border-yellow-600/10 mb-3">
                          Full Judgement
                        </div>
                        <div className="text-sm leading-relaxed text-white/58"
                          dangerouslySetInnerHTML={{ __html: docDetail.fulltext }} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/15">
                        <FileText size={28} />
                        <span className="text-xs">Full text not available</span>
                        <span className="text-[10px]">Open on Indian Kanoon to read complete judgement</span>
                      </div>
                    )}
                    {docDetail.acts?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600/60 pb-2 border-b border-yellow-600/10 mb-3">
                          Provisions Cited
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {docDetail.acts.slice(0, 20).map((act, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-white/45 font-mono">
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-700 flex gap-2 flex-shrink-0 bg-slate-900">
                    <button
                      onClick={() => printJudgement(docDetail)}
                      className="h-8 px-4 bg-yellow-700 rounded text-xs font-semibold text-slate-900 hover:bg-yellow-600 transition-colors flex items-center gap-1.5"
                    >
                      <Printer size={13} /> Print / PDF
                    </button>
                    <button
                      onClick={copyCitation}
                      className="h-8 px-3 bg-transparent border border-slate-700 rounded text-xs text-white/50 hover:text-white/75 hover:border-slate-500 transition-colors flex items-center gap-1.5"
                    >
                      <Copy size={13} /> Copy Citation
                    </button>
                    <button
                      onClick={handleSaveToggle}
                      className={`h-8 px-3 border rounded text-xs transition-colors flex items-center gap-1.5 ${
                        isSaved(docDetail.id)
                          ? 'border-yellow-600/50 text-yellow-500 bg-yellow-600/8'
                          : 'bg-transparent border-slate-700 text-white/50 hover:text-white/75'
                      }`}
                    >
                      <Bookmark size={13} fill={isSaved(docDetail.id) ? 'currentColor' : 'none'} />
                      {isSaved(docDetail.id) ? 'Saved' : 'Save'}
                    </button>
                    <div className="flex-1" />
                    <a
                      href={`https://indiankanoon.org/doc/${docDetail.id}/`}
                      target="_blank" rel="noreferrer"
                      className="h-8 px-3 bg-transparent border border-slate-700 rounded text-xs text-white/50 hover:text-white/75 hover:border-slate-500 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} /> Indian Kanoon
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/15">
                  <Gavel size={36} />
                  <span className="text-sm">Select a judgement to read</span>
                </div>
              )}
            </div>
          </div>

          {/* MODULE BAR */}
          <div className="h-11 bg-slate-900 border-t border-slate-700 flex items-center gap-1 px-4 overflow-x-auto flex-shrink-0">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                className={`h-7 px-3 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeModule === mod.id
                    ? 'bg-yellow-600/15 text-yellow-500'
                    : 'bg-white/4 text-white/38 hover:text-white/65 hover:bg-white/6'
                }`}
              >
                {mod.isLatest && (
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block animate-pulse flex-shrink-0" />
                )}
                {mod.label}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JudgementsPage;
