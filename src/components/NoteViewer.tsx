import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Note, Course } from '../types';

const NoteImage = ({ note, className }: { note: Note; className?: string }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    const cached = localStorage.getItem(`decker_cache_image_${note.id}`);
    if (cached) {
      setSrc(cached);
    } else if (note.images && note.images[0]) {
      setSrc(note.images[0]);
    } else {
      setSrc('');
    }
  }, [note.id, note.images]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={note.title}
      className={className}
      loading="lazy"
    />
  );
};

interface NoteViewerProps {
  note: Note;
  course?: Course;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDelete?: (id: string) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalNotes?: number;
  isCourseRep?: boolean;
}

export default function NoteViewer({
  note,
  course,
  onClose,
  onNext,
  onPrev,
  onDelete,
  hasPrev = false,
  hasNext = false,
  currentIndex = 0,
  totalNotes = 1,
  isCourseRep = false,
}: NoteViewerProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F5] select-none font-sans overflow-hidden">
      
      {/* 1. Header Toolbar matching Screenshot 2 precisely */}
      <div className="flex h-20 items-center justify-between px-6 shrink-0 z-10">
        
        {/* Circle Back Button on Left */}
        <button
          onClick={onClose}
          id="btn-viewer-close"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#FAF9F5] hover:text-slate-900 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 stroke-[2.2]" />
        </button>

        {/* Empty space in middle matching Screenshot 2 */}
        <div className="flex-1" />

        {/* Circle Options/More Button on Right - only show if Course Representative */}
        {isCourseRep && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              id="btn-viewer-options"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#FAF9F5] transition-all shadow-xs cursor-pointer"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showOptions && onDelete && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg z-50 text-left">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently delete this slide?')) {
                      onDelete(note.id);
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Slide</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Slide Image Canvas Stage (Pushed up high and beautiful) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 pb-4 overflow-hidden relative">
        <div className="w-full max-w-sm aspect-[210/297] flex items-center justify-center rounded-2xl bg-white border border-[#F3F4F6] shadow-[0_6px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          {note.images && note.images[0] ? (
            <NoteImage
              note={note}
              className="max-h-full w-auto object-contain select-none max-w-full"
            />
          ) : (
            <div className="text-center text-slate-400 p-8">
              <MoreVertical className="h-8 w-8 mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-xs font-semibold text-slate-400">Empty Lecture Note Slide</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                No whiteboard photo was captured during this study period.
              </p>
            </div>
          )}
        </div>

        {/* Muted description caption area below the canvas if available */}
        {note.description && (
          <div className="mt-5 max-w-md w-full text-center">
            <p className="text-[11px] text-[#444654] font-medium leading-relaxed px-6 line-clamp-2">
              {note.description}
            </p>
          </div>
        )}
      </div>

      {/* 3. Navigation controller bar matching Screenshot 2 precisely */}
      <div className="h-28 pb-9 flex items-center justify-center gap-4 shrink-0 z-10">
        
        {/* Left Arrow Navigation Button */}
        <button
          onClick={onPrev}
          id="btn-viewer-prev"
          disabled={!hasPrev}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 transition-all shadow-xs cursor-pointer ${
            hasPrev ? 'text-slate-800 hover:bg-slate-50' : 'text-slate-305 pointer-events-none opacity-40'
          }`}
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.2]" />
        </button>

        {/* Elegant circular booklet/slide descriptor pill as in Screenshot 2 */}
        <div className="bg-white border border-slate-200/95 rounded-full px-8 py-3.5 shadow-xs flex flex-col items-center justify-center min-w-[220px] max-w-xs select-none">
          <span className="text-[13px] font-black text-[#191c1d] tracking-tight truncate max-w-[180px] leading-tight">
            {note.title}
          </span>
          <span className="text-[10px] font-semibold text-[#444654] opacity-80 mt-0.5 tracking-wide">
            {currentIndex + 1} of {totalNotes}
          </span>
        </div>

        {/* Right Arrow Navigation Button */}
        <button
          onClick={onNext}
          id="btn-viewer-next"
          disabled={!hasNext}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 transition-all shadow-xs cursor-pointer ${
            hasNext ? 'text-slate-800 hover:bg-slate-50' : 'text-slate-305 pointer-events-none opacity-40'
          }`}
        >
          <ChevronRight className="h-6 w-6 stroke-[2.2]" />
        </button>

      </div>

    </div>
  );
}
