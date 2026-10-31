/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLASSIFIED CASE FILES VIEWER — FIRST DIRECTIVE & ARCHIVAL COLLECTION
 * 
 * A forensic archive viewer for the 6 historic Zodiac classified dossiers & archival plates.
 * Supports:
 * - Differentiated dual-collection inspection:
 *   1. "First Directive Dossiers" (Declassified Typewriter Incident Reports)
 *   2. "Archival Facsimile Plates" (Original Optical Crime Scene Photographic Negatives)
 * - Immediate synchronized collection switching preserving corresponding document pairing
 * - Unconstrained document canvas with independent scrolling and natural aspect ratios
 * - True Fullscreen Mode with dedicated HUD, navigation, zoom, and escape handling
 * - Dedicated Separate Page standalone viewing mode (/case-files?standalone=true)
 * - Responsive support across Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024), and Mobile (390x844)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CLASSIFIED_CASE_DOCUMENTS,
  ARCHIVAL_FACSIMILE_DOCUMENTS,
  getCaseDocuments,
  getCaseDocumentById,
  type CaseDocumentItem,
} from '@/src/lib/caseDocuments';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { CASE_ID } from '@/src/lib/mockData';

interface ClassifiedCaseFilesViewerProps {
  initialDocId?: string;
  initialCollection?: 'directive' | 'archival';
  onReturnToDirective: () => void;
  isModal?: boolean;
  isStandalonePage?: boolean;
}

export function ClassifiedCaseFilesViewer({
  initialDocId,
  initialCollection,
  onReturnToDirective,
  isModal = false,
  isStandalonePage = false,
}: ClassifiedCaseFilesViewerProps) {
  // Collection state: 'directive' vs 'archival'
  const [collectionMode, setCollectionMode] = useState<'directive' | 'archival'>(() => {
    if (initialCollection) return initialCollection;
    if (initialDocId && initialDocId.startsWith('arch-')) return 'archival';
    return 'directive';
  });

  // Track active document ID to avoid numerical index desynchronization
  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    if (initialDocId) {
      const match = getCaseDocumentById(initialDocId);
      if (match) return match.id;
    }
    return CLASSIFIED_CASE_DOCUMENTS[0].id;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanZoom, setScanZoom] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active documents for the selected collection
  const activeDocuments = useMemo(() => {
    return getCaseDocuments(collectionMode);
  }, [collectionMode]);

  // Resolve current active document
  const currentDoc: CaseDocumentItem = useMemo(() => {
    const foundInActive = activeDocuments.find((d) => d.id === selectedDocId);
    if (foundInActive) return foundInActive;

    // If ID is from the other collection, find counterpart by documentNumber
    const targetItem = getCaseDocumentById(selectedDocId);
    if (targetItem) {
      const counterpart = activeDocuments.find((d) => d.documentNumber === targetItem.documentNumber);
      if (counterpart) return counterpart;
    }

    return activeDocuments[0];
  }, [activeDocuments, selectedDocId]);

  // Keep selectedDocId synchronized with currentDoc
  useEffect(() => {
    if (currentDoc && currentDoc.id !== selectedDocId) {
      setSelectedDocId(currentDoc.id);
    }
  }, [currentDoc, selectedDocId]);

  // Fullscreen keyboard shortcuts (Escape to exit, Arrow keys to navigate, +/- to zoom)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;

      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
        tacticalAudio.playButtonClick();
      } else if (e.key === 'ArrowRight') {
        const currentIndex = activeDocuments.findIndex((d) => d.id === currentDoc.id);
        const nextIndex = (currentIndex + 1) % activeDocuments.length;
        handleSelectDoc(activeDocuments[nextIndex].id);
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = activeDocuments.findIndex((d) => d.id === currentDoc.id);
        const prevIndex = (currentIndex - 1 + activeDocuments.length) % activeDocuments.length;
        handleSelectDoc(activeDocuments[prevIndex].id);
      } else if (e.key === '+' || e.key === '=') {
        setScanZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)));
      } else if (e.key === '-') {
        setScanZoom((z) => Math.max(0.7, +(z - 0.2).toFixed(1)));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, activeDocuments, currentDoc.id]);

  const handleSelectDoc = (docId: string) => {
    tacticalAudio.playDocOpen();
    setSelectedDocId(docId);
    setScanZoom(1);
    setMobileMenuOpen(false);
  };

  const handleSwitchCollection = (newMode: 'directive' | 'archival') => {
    tacticalAudio.playButtonClick();
    const currentNumber = currentDoc.documentNumber;
    setCollectionMode(newMode);
    setScanZoom(1);
    setSearchQuery('');

    // Switch to counterpart document in target collection
    const targetDocs = getCaseDocuments(newMode);
    const counterpart = targetDocs.find((d) => d.documentNumber === currentNumber) || targetDocs[0];
    setSelectedDocId(counterpart.id);
  };

  const handleNextDoc = () => {
    const currentIndex = activeDocuments.findIndex((d) => d.id === currentDoc.id);
    const nextIndex = (currentIndex + 1) % activeDocuments.length;
    handleSelectDoc(activeDocuments[nextIndex].id);
  };

  const handlePrevDoc = () => {
    const currentIndex = activeDocuments.findIndex((d) => d.id === currentDoc.id);
    const prevIndex = (currentIndex - 1 + activeDocuments.length) % activeDocuments.length;
    handleSelectDoc(activeDocuments[prevIndex].id);
  };

  const handleOpenSeparatePage = () => {
    tacticalAudio.playButtonClick();
    const url = `/case-files?doc=${encodeURIComponent(currentDoc.id)}&collection=${collectionMode}&standalone=true`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtered documents for search
  const filteredDocs = activeDocuments.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.caseNumber.toLowerCase().includes(q) ||
      doc.victimName.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.shortTitle.toLowerCase().includes(q)
    );
  });

  /* =========================================================================
     FULLSCREEN OVERLAY RENDER
     ========================================================================= */
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-[#070908] text-[#ebe6dc] flex flex-col w-screen h-screen overflow-hidden font-mono text-xs select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen Document Viewer"
      >
        {/* Fullscreen Floating Tactical Header Bar */}
        <header className="bg-[#0e1410] border-b border-[#233527] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-2xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                setIsFullscreen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 font-bold transition-colors text-xs"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 size={14} />
              <span>EXIT FULLSCREEN</span>
              <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-black/40 border border-red-700/60 text-[10px]">
                ESC
              </kbd>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#233527]">
              <span className="font-bold text-[#8deb9e] text-[11px] uppercase tracking-wider">
                {collectionMode === 'directive' ? 'FIRST DIRECTIVE DOSSIER' : 'ARCHIVAL FACSIMILE PLATE'}{' '}
                0{currentDoc.documentNumber} // {currentDoc.caseNumber}
              </span>
              <span className="text-muted-foreground hidden md:inline">
                ({currentDoc.shortTitle})
              </span>
            </div>
          </div>

          {/* Center Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDoc}
              className="p-1.5 border border-[#233527] hover:border-[#8deb9e] bg-[#111813] text-muted-foreground hover:text-white transition-colors"
              title="Previous Document (Left Arrow)"
              aria-label="Previous Document"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-[11px] px-2 text-[#8deb9e]">
              0{currentDoc.documentNumber} / 0{activeDocuments.length}
            </span>
            <button
              onClick={handleNextDoc}
              className="p-1.5 border border-[#233527] hover:border-[#8deb9e] bg-[#111813] text-muted-foreground hover:text-white transition-colors"
              title="Next Document (Right Arrow)"
              aria-label="Next Document"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Right Controls: Zoom & Collection Toggle */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center border border-[#233527] bg-[#111813] p-0.5">
              <button
                onClick={() => setScanZoom((z) => Math.max(0.7, +(z - 0.2).toFixed(1)))}
                className="p-1 text-muted-foreground hover:text-white"
                title="Zoom Out (-)"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[10px] w-12 text-center text-[#8deb9e]">
                {Math.round(scanZoom * 100)}%
              </span>
              <button
                onClick={() => setScanZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
                className="p-1 text-muted-foreground hover:text-white"
                title="Zoom In (+)"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setScanZoom(1)}
                className="px-1.5 py-0.5 text-[10px] border-l border-[#233527] text-muted-foreground hover:text-white"
                title="Reset Fit"
              >
                Fit
              </button>
            </div>

            {/* Collection Switcher in Fullscreen */}
            <div className="hidden lg:flex items-center border border-[#233527] bg-[#111813] p-0.5">
              <button
                onClick={() => handleSwitchCollection('directive')}
                className={`px-2 py-1 text-[10px] font-bold ${
                  collectionMode === 'directive'
                    ? 'bg-[#1e2e22] text-[#8deb9e]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Typewriter
              </button>
              <button
                onClick={() => handleSwitchCollection('archival')}
                className={`px-2 py-1 text-[10px] font-bold ${
                  collectionMode === 'archival'
                    ? 'bg-amber-950/80 text-amber-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Archival Scan
              </button>
            </div>

            <button
              onClick={handleOpenSeparatePage}
              className="hidden sm:flex items-center gap-1 border border-[#233527] hover:border-[#8deb9e] px-2.5 py-1 text-[11px] text-muted-foreground hover:text-white transition-colors"
              title="Open this file in an isolated browser tab"
            >
              <ExternalLink size={12} />
              <span>Separate Page</span>
            </button>
          </div>
        </header>

        {/* Fullscreen Unconstrained Document Scroll Surface */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex justify-center items-start touch-pan-y">
          <div
            style={{ transform: `scale(${scanZoom})`, transformOrigin: 'top center' }}
            className="w-full max-w-4xl transition-transform duration-100 ease-out"
          >
            {collectionMode === 'directive' ? (
              <TypewriterSheetView doc={currentDoc} />
            ) : (
              <ArchivalPlateView doc={currentDoc} />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     STANDARD / STANDALONE VIEW RENDER
     ========================================================================= */
  return (
    <div
      className={`flex flex-col bg-[#080b09] text-[#ebe6dc] border border-[#233527] shadow-[0_0_50px_rgba(10,35,18,0.5)] font-mono text-xs ${
        isStandalonePage ? 'min-h-screen border-none shadow-none' : ''
      }`}
    >
      {/* Standalone Page Top Banner (when opened as separate page) */}
      {isStandalonePage && (
        <div className="bg-[#121c15] border-b border-[#233527] px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[#8deb9e] tracking-wider text-[11px] uppercase">
              STANDALONE CASE FILE REPOSITORY // DISPATCH SESSION 17-B
            </span>
          </div>
          <button
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            className="text-[#8deb9e] hover:underline flex items-center gap-1 font-bold text-xs"
          >
            <ArrowLeft size={13} />
            <span>Return to Investigation Dashboard</span>
          </button>
        </div>
      )}

      {/* Primary Header Bar */}
      <header className="bg-[#0f1511] border-b border-[#233527] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              onReturnToDirective();
            }}
            className="flex items-center gap-1.5 text-xs text-[#8deb9e] hover:text-white transition-colors border border-[#27402e] bg-[#142118] px-3 py-1.5 font-bold"
          >
            <ArrowLeft size={14} />
            <span>{isStandalonePage ? 'RETURN TO DASHBOARD' : 'RETURN TO DIRECTIVE'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#233527]">
            <span className="size-2 rounded-full bg-crimson animate-ping" />
            <span className="font-bold tracking-widest text-[#dcd6c9] uppercase text-[11px]">
              CLASSIFIED DOSSIER ARCHIVE // CASE {CASE_ID}
            </span>
          </div>
        </div>

        {/* Dual Collection Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0d120e] border border-[#233527] p-0.5">
            <button
              onClick={() => handleSwitchCollection('directive')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold transition-colors ${
                collectionMode === 'directive'
                  ? 'bg-[#1e2e22] text-[#8deb9e] shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={13} />
              <span>1. First Directive ({CLASSIFIED_CASE_DOCUMENTS.length})</span>
            </button>
            <button
              onClick={() => handleSwitchCollection('archival')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold transition-colors ${
                collectionMode === 'archival'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60 shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers size={13} />
              <span>2. Archival Plates ({ARCHIVAL_FACSIMILE_DOCUMENTS.length})</span>
            </button>
          </div>

          {/* Action Buttons: Fullscreen & Separate Page */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                setIsFullscreen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 border border-emerald-600/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-bold transition-colors text-xs"
              title="Expand to Fullscreen (occupies 100% of screen without UI clutter)"
            >
              <Maximize2 size={13} />
              <span>FULLSCREEN</span>
            </button>

            {!isStandalonePage && (
              <button
                onClick={handleOpenSeparatePage}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 border border-[#233527] hover:border-[#8deb9e] text-muted-foreground hover:text-white transition-colors text-[11px]"
                title="Open selected case file in separate page"
              >
                <ExternalLink size={12} />
                <span>Separate Page</span>
              </button>
            )}

            {isModal && (
              <button
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  onReturnToDirective();
                }}
                className="text-muted-foreground hover:text-foreground p-1.5 border border-[#233527] hover:border-[#38523f]"
                aria-label="Close dossier viewer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout: Independent Responsive Sidebar + Document Canvas */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Mobile Document Selector Toggle */}
        <div className="lg:hidden p-2.5 bg-[#0d120e] border-b border-[#233527] flex items-center justify-between">
          <div className="font-bold text-[#8deb9e] text-xs">
            0{currentDoc.documentNumber}. {currentDoc.shortTitle}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="px-2.5 py-1 border border-[#233527] text-xs font-bold text-muted-foreground hover:text-white"
          >
            {mobileMenuOpen ? 'Hide File Menu' : 'Browse Files (6)'}
          </button>
        </div>

        {/* Document Navigation Sidebar */}
        <aside
          className={`w-full lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#233527] bg-[#0b0f0c] flex flex-col ${
            mobileMenuOpen ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Collection Status Banner */}
          <div className="p-3 border-b border-[#233527] bg-[#101712] space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 ${
                  collectionMode === 'directive' ? 'text-[#8deb9e]' : 'text-amber-400'
                }`}
              >
                {collectionMode === 'directive' ? <FolderOpen size={13} /> : <Layers size={13} />}
                <span>
                  {collectionMode === 'directive'
                    ? `FIRST DIRECTIVE DOSSIERS (${activeDocuments.length})`
                    : `ARCHIVAL FACSIMILE PLATES (${activeDocuments.length})`}
                </span>
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 border font-mono ${
                  collectionMode === 'directive'
                    ? 'bg-[#1b2b1f] text-[#8deb9e] border-[#2b4432]'
                    : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                }`}
              >
                {collectionMode === 'directive' ? 'DECLASSIFIED' : 'FACSIMILE'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal m-0">
              {collectionMode === 'directive'
                ? 'Departmental typewriter summaries from 1968–1969 incidents with verbatim typographical evidence.'
                : 'Original high-resolution photographic negatives, teletype dispatch ribbons, and lab access worksheets.'}
            </p>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-[#233527] bg-[#080d0a]">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder={
                  collectionMode === 'directive'
                    ? 'Filter case #, victim, location...'
                    : 'Filter plate #, specimen, negative...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101612] border border-[#243328] pl-7 pr-2 py-1.5 text-[11px] text-[#ebe6dc] focus:outline-none focus:border-[#8deb9e]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Document Tabs List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1b261e] p-2 space-y-1 max-h-[450px] lg:max-h-[calc(100vh-280px)]">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === currentDoc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`w-full text-left p-2.5 transition-colors flex flex-col gap-1 border ${
                    isSelected
                      ? collectionMode === 'directive'
                        ? 'bg-[#18261c] border-[#3e6849] shadow-[0_0_15px_rgba(62,104,73,0.3)]'
                        : 'bg-[#22180f] border-[#7d5023] shadow-[0_0_15px_rgba(125,80,35,0.3)]'
                      : 'bg-[#0f1410] border-[#1d2920] hover:bg-[#141b16] hover:border-[#273a2c]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold tracking-wider ${
                        isSelected
                          ? collectionMode === 'directive'
                            ? 'text-[#8deb9e]'
                            : 'text-amber-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {collectionMode === 'directive' ? `DOC 0${doc.documentNumber}` : `PLATE 0${doc.documentNumber}`} // {doc.caseNumber}
                    </span>
                    {doc.isDraftOrCorrupted ? (
                      <span className="text-[9px] px-1 py-0.2 text-amber-300 bg-amber-950/60 border border-amber-600/40">
                        GLITCHED
                      </span>
                    ) : collectionMode === 'archival' ? (
                      <span className="text-[9px] px-1 py-0.2 text-amber-400 bg-amber-950/40 border border-amber-700/40">
                        NEGATIVE
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.2 text-emerald-400 bg-emerald-950/60 border border-emerald-600/30">
                        STANDARD
                      </span>
                    )}
                  </div>
                  <div className="font-serif text-[12px] font-normal text-[#e8e2d5] truncate">
                    {doc.shortTitle || doc.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-0.5">
                    <span>{doc.dateOfIncident.split('/')[0].trim()}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80 truncate max-w-[120px]">
                      {doc.agencyHeader.dept.split('•')[0].trim()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Pagination footer */}
          <div className="p-2.5 border-t border-[#233327] bg-[#101612] flex items-center justify-between text-[11px] shrink-0">
            <button
              onClick={handlePrevDoc}
              className="px-2 py-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white transition-colors"
            >
              ← Prev
            </button>
            <span
              className={
                collectionMode === 'directive'
                  ? 'text-[#8deb9e] font-bold text-[10px]'
                  : 'text-amber-400 font-bold text-[10px]'
              }
            >
              0{currentDoc.documentNumber} / 0{activeDocuments.length}
            </span>
            <button
              onClick={handleNextDoc}
              className="px-2 py-1 border border-[#233327] hover:border-[#8deb9e] text-muted-foreground hover:text-white transition-colors"
            >
              Next →
            </button>
          </div>
        </aside>

        {/* Main Document Inspection Canvas — Independent Scroll Surface */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#060807] flex flex-col justify-between min-h-[500px]">
          <div className="max-w-4xl w-full mx-auto space-y-6">
            {/* Context alert for glitched vs standard versions (Docs 2 & 4) */}
            {currentDoc.id.includes('1220-draft') && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    ARCHIVAL CORRUPTION DETECTED // DRAFT TRANSMISSION RECORD
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed m-0 font-serif">
                    This file contains garbled teletype anomalies, syntax collisions, and corrupted
                    word clusters (e.g. <em>"hih Larm Arthur..."</em>, <em>"vehiced"</em>,{' '}
                    <em>"fcrraalant"</em>, <em>"lititial"</em>, <em>"likis"</em>). All corrupted
                    character strings have been preserved verbatim for forensic comparative analysis
                    against Standard Version SOL-1968-1220 (Doc 04).
                  </p>
                </div>
              </div>
            )}

            {currentDoc.id.includes('1220-std') && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-700/50 text-emerald-200 text-xs flex items-start gap-3">
                <FileCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
                    CANONICAL SOLANO DEPARTMENT SUMMARY // STANDARD REVISED VERSION
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed m-0">
                    Comparative clean record concerning the Lake Herman Road turnout double homicide
                    of David Arthur Faraday and Betty Lou Jensen. Maintained as a distinct record from
                    Draft Document 02.
                  </p>
                </div>
              </div>
            )}

            {/* Document Header Controls & Fullscreen Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233527] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 border font-bold ${
                    collectionMode === 'directive'
                      ? 'bg-[#17231a] text-[#8deb9e] border-[#2c4b34]'
                      : 'bg-amber-950/40 text-amber-300 border-amber-700/50'
                  }`}
                >
                  {collectionMode === 'directive' ? 'CASE FILE' : 'ARCHIVAL SPECIMEN'} {currentDoc.caseNumber}
                </span>
                <span className="text-muted-foreground hidden sm:inline">
                  • Incident Date: {currentDoc.dateOfIncident}
                </span>
              </div>

              {/* View mode toggle for directive collection or zoom controls for archival scans */}
              <div className="flex items-center gap-2">
                {collectionMode === 'archival' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px] hidden sm:inline">Scan Zoom:</span>
                    <button
                      onClick={() => setScanZoom((z) => Math.max(0.7, +(z - 0.2).toFixed(1)))}
                      className="p-1 border border-[#233527] hover:border-amber-400 text-muted-foreground hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="font-mono text-[10px] text-amber-300 w-12 text-center">
                      {Math.round(scanZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setScanZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
                      className="p-1 border border-[#233527] hover:border-amber-400 text-muted-foreground hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      onClick={() => setScanZoom(1)}
                      className="p-1 border border-[#233527] hover:border-amber-400 text-muted-foreground hover:text-white text-[10px]"
                      title="Reset Zoom"
                    >
                      Fit
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center bg-[#0d120e] border border-[#233527] p-0.5">
                    <span className="text-[10px] text-muted-foreground px-2">Format:</span>
                    <span className="text-[10px] text-[#8deb9e] bg-[#1a2b1e] border border-[#29422f] px-2 py-0.5 font-bold">
                      Typewriter Transcript
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 border border-[#233527] hover:border-[#8deb9e] text-muted-foreground hover:text-[#8deb9e] transition-colors"
                  title="Expand to Fullscreen"
                  aria-label="Expand to Fullscreen"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {/* Document Render: Typewriter Sheet or Archival Photographic Plate */}
            {collectionMode === 'directive' ? (
              <TypewriterSheetView doc={currentDoc} />
            ) : (
              <ArchivalPlateView doc={currentDoc} zoom={scanZoom} />
            )}
          </div>

          {/* Bottom Directive Return & Progression Action */}
          <div className="mt-8 pt-4 border-t border-[#233527] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl w-full mx-auto">
            <div className="text-[11px] text-muted-foreground">
              Reviewing classified record <strong>0{currentDoc.documentNumber} of 0{activeDocuments.length}</strong>. Ready to
              solve Stage 01?
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleNextDoc}
                className="button button-secondary text-xs w-full sm:w-auto font-mono py-2.5 px-4"
              >
                Next Case Dossier →
              </button>
              <button
                onClick={() => {
                  tacticalAudio.playSuccess();
                  onReturnToDirective();
                }}
                className="button bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-mono font-bold tracking-wider py-2.5 px-5 w-full sm:w-auto shadow-md flex items-center justify-center gap-2"
              >
                <span>RETURN TO FIRST DIRECTIVE</span>
                <CheckCircle size={14} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   TYPEWRITER TRANSCRIPT SHEET VIEW
   ========================================================================= */
function TypewriterSheetView({ doc }: { doc: CaseDocumentItem }) {
  return (
    <div
      className="relative bg-[#ebe4d3] text-[#1c1917] p-6 sm:p-10 md:p-12 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-[#c4baa1] font-mono leading-relaxed"
      style={{
        backgroundImage: 'radial-gradient(#d6cbb1 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Vintage archival paper stain overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100 via-transparent to-amber-900/20"
      />

      {/* Top Agency Header & Confidential Rubber Stamps */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#1c1917] pb-4 mb-6">
        <div className="space-y-0.5">
          <div className="font-bold text-xs uppercase tracking-wider text-[#1c1917]">
            {doc.agencyHeader.dept}
          </div>
          {doc.agencyHeader.subDept && (
            <div className="text-[11px] text-[#44403c] uppercase tracking-wide">
              {doc.agencyHeader.subDept}
            </div>
          )}
          {doc.agencyHeader.addressLines?.map((line, i) => (
            <div key={i} className="text-[10px] text-[#57534e]">
              {line}
            </div>
          ))}
        </div>

        {/* Rubber stamps */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 self-end sm:self-start">
          {doc.stamps.map((stamp, idx) => {
            const isSecret = stamp.includes('SECRET');
            const isConfidential = stamp.includes('CONFIDENTIAL');
            const isActive = stamp.includes('ACTIVE');
            return (
              <div
                key={idx}
                className={`font-mono font-black text-[11px] tracking-[0.2em] uppercase px-2.5 py-0.5 border-2 transform ${
                  idx % 2 === 0 ? '-rotate-1' : 'rotate-2'
                } ${
                  isSecret
                    ? 'border-red-700 text-red-700 bg-red-100/40'
                    : isConfidential
                    ? 'border-red-800 text-red-800 bg-red-50/50'
                    : isActive
                    ? 'border-emerald-800 text-emerald-800 bg-emerald-50/40'
                    : 'border-[#44403c] text-[#44403c]'
                }`}
              >
                {stamp}
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Main Headline */}
      <div className="space-y-1 mb-6">
        <h1 className="font-mono text-xl sm:text-2xl font-black tracking-tight text-[#1c1917] uppercase">
          {doc.title}
        </h1>
        <div className="font-mono text-sm sm:text-base font-bold text-[#44403c] tracking-widest uppercase">
          CASE FILE {doc.caseNumber}
        </div>
      </div>

      {/* Metadata Matrix Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-[#44403c] bg-[#e4dcbf]/40 p-3 mb-6 text-[10px]">
        <div>
          <span className="block font-bold text-[#57534e] uppercase">CASE FILE</span>
          <span className="font-semibold text-[#1c1917]">{doc.caseNumber}</span>
        </div>
        <div>
          <span className="block font-bold text-[#57534e] uppercase">DATE OF INCIDENT</span>
          <span className="font-semibold text-[#1c1917]">{doc.dateOfIncident}</span>
        </div>
        <div>
          <span className="block font-bold text-[#57534e] uppercase">LOCATION</span>
          <span className="font-semibold text-[#1c1917]">{doc.location}</span>
        </div>
        <div>
          <span className="block font-bold text-[#57534e] uppercase">REPORTED BY</span>
          <span className="font-semibold text-[#1c1917]">{doc.reportedBy}</span>
        </div>
      </div>

      {/* Body Sections */}
      <div className="space-y-6 text-xs text-[#292524] leading-relaxed">
        {/* 1. Incident Summary */}
        <section className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
            INCIDENT SUMMARY
          </h2>
          <div className="whitespace-pre-line text-[#1c1917] font-mono text-[12px] leading-relaxed">
            {doc.summary}
          </div>
        </section>

        {/* 2. Victim Profile(s) */}
        <section className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
            VICTIM PROFILE
          </h2>
          <div className="space-y-1.5 text-[#1c1917] font-mono text-[12px]">
            {doc.victimProfiles.map((profile, i) => (
              <p key={i} className="m-0 leading-relaxed">
                {profile}
              </p>
            ))}
          </div>
        </section>

        {/* 3. Ballistic & Physical Evidence */}
        <section className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
            BALLISTIC &amp; PHYSICAL EVIDENCE
          </h2>
          <div className="space-y-1 text-[#1c1917] font-mono text-[12px]">
            {doc.ballisticsAndPhysicalEvidence.map((ev, i) => (
              <p key={i} className="m-0 leading-relaxed">
                {ev}
              </p>
            ))}
          </div>
        </section>

        {/* 4. Case Status */}
        <section className="space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#1c1917] border-b border-[#a8a29e] pb-1">
            CASE STATUS
          </h2>
          <div className="text-[#1c1917] font-mono text-[12px] leading-relaxed">
            {doc.caseStatus}
          </div>
        </section>
      </div>

      {/* Sign-off Block */}
      <div className="mt-8 pt-4 border-t-2 border-[#1c1917] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
        <div className="space-y-1">
          <div className="text-[11px] text-[#57534e]">Signature:</div>
          <div
            className={`font-serif text-lg text-[#1c1917] font-bold ${
              doc.investigatorSignature.isHandwritten ? 'italic underline' : ''
            }`}
          >
            {doc.investigatorSignature.signatureText}
          </div>
          <div className="text-[11px] font-bold text-[#1c1917] uppercase tracking-wide">
            {doc.investigatorSignature.leadTitle}
          </div>
          {doc.investigatorSignature.signedDate && (
            <div className="text-[10px] text-[#44403c]">
              {doc.investigatorSignature.signedDate}
            </div>
          )}
        </div>

        <div className="text-right space-y-1 self-end">
          <div className="font-mono font-black text-xs text-red-900 border border-red-800 px-2 py-0.5 uppercase tracking-widest inline-block">
            CASE FILE - ACTIVE
          </div>
          <div className="text-[10px] text-[#57534e] tracking-widest uppercase">
            {doc.footerNotice}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ARCHIVAL FACSIMILE PLATE VIEW (HIGH-RES PHOTO NEGATIVE)
   ========================================================================= */
function ArchivalPlateView({ doc, zoom = 1 }: { doc: CaseDocumentItem; zoom?: number }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-[#131b15] border border-[#243328] flex items-center justify-between text-xs text-[#a6d8b2]">
        <div className="flex items-center gap-2">
          <ImageIcon size={15} className="text-[#8deb9e]" />
          <span>
            ORIGINAL POLICE ARCHIVE PHOTOGRAPH // CAS-TLS-0017 / {doc.caseNumber}
          </span>
        </div>
        <a
          href={doc.imagePath}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] text-[#8deb9e] hover:underline"
        >
          <span>Open Raw Asset</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Unconstrained Image Viewport with Independent Smooth Scroll */}
      <div className="bg-black border border-[#2b3a30] p-4 flex items-center justify-center overflow-auto shadow-inner rounded-sm min-h-[420px]">
        <img
          src={doc.imagePath}
          alt={`${doc.title} original scan`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 max-w-full h-auto object-contain shadow-2xl rounded-sm"
          loading="lazy"
        />
      </div>

      {/* Specimen Telemetry Card */}
      <div className="p-3.5 bg-[#0e1410] border border-[#243328] text-xs font-mono space-y-1.5">
        <div className="flex justify-between items-center border-b border-[#1f2d22] pb-1 text-[10px] text-muted-foreground uppercase">
          <span>PLATE DESIGNATION: {doc.title}</span>
          <span className="text-amber-400 font-bold">16MM OPTICAL EMULSION</span>
        </div>
        <p className="text-[11px] text-[#d6cfc2] m-0 leading-relaxed font-serif">
          {doc.summary}
        </p>
      </div>
    </div>
  );
}
