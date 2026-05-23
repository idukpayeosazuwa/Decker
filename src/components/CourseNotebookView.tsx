import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Trash2,
  FileText
} from 'lucide-react';
import { Course, Note } from '../types';

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

interface CourseNotebookViewProps {
  course: Course;
  notes: Note[];
  onBack: () => void;
  onUploadClick: () => void; // Unused but kept for props compatibility
  onNoteClick: (note: Note) => void;
  onReorderNote: (noteId: string, direction: 'up' | 'down') => void;
  onDeleteNote: (noteId: string) => void;
  isCourseRep?: boolean;
}

export default function CourseNotebookView({
  course,
  notes,
  onBack,
  onNoteClick,
  onReorderNote,
  onDeleteNote,
  isCourseRep = false,
}: CourseNotebookViewProps) {
  const [courseSearch, setCourseSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Notebooks are sorted sequentially
  const sortedNotes = [...notes].sort((a, b) => a.order - b.order);

  // Filter notes by search query
  const filteredNotes = sortedNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] font-sans">
      
      {/* Top Header Row modeled after Image 1 */}
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-3 font-sans shrink-0">
        <button
          onClick={onBack}
          id="btn-back-notebooks"
          className="p-1.5 rounded-full text-zinc-750 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
        </button>

        <h1 className="text-base font-black text-[#2c50cd] tracking-tight text-center flex-1 font-sans">
          {course.name}
        </h1>

        <button
          onClick={() => setIsSearchActive(!isSearchActive)}
          className="p-1.5 rounded-full text-zinc-750 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Search className="h-4.5 w-4.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Slide filter box toggle */}
      {isSearchActive && (
        <div className="mt-2 text-left shrink-0">
          <input
            type="text"
            placeholder="Search slides in this notebook..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="block w-full rounded border border-slate-200 bg-white py-1.5 px-3 text-[11px] text-[#191c1d] placeholder-slate-400 outline-none transition-all focus:border-brand"
          />
        </div>
      )}

      {/* Negative horizontal margins to push the slides edge-to-edge as in Screenshot 1 */}
      <div className="flex-1 overflow-y-auto mt-3 pb-24 space-y-0.5 -mx-5">
        {filteredNotes.length === 0 ? (
          <div className="mx-5 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <BookOpen className="mx-auto h-7 w-7 text-neutral-300 mb-2" />
            <h3 className="text-xs font-bold text-slate-800">Empty Notebook</h3>
            <p className="mt-1 text-[10px] text-slate-400 max-w-xs mx-auto">
              {courseSearch ? 'No matching slide notes' : 'Tap the bottom plus action button or Upload tab to insert slide images.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const formattedIndex = String(note.order).padStart(2, '0');
            const hasImage = note.images && note.images[0];
            return (
              <div
                key={note.id}
                onClick={() => onNoteClick(note)}
                className="group relative w-full aspect-[210/297] overflow-hidden cursor-pointer select-none bg-[#C3C4C6]"
              >
                {/* 1. Background Image or Muted placeholder exactly as Screenshot 1 */}
                {hasImage ? (
                  <NoteImage
                    note={note}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-[#d2d3d5] flex items-center justify-center text-[#717377]">
                    <FileText className="h-16 w-16 stroke-[1.2]" />
                  </div>
                )}

                {/* 2. Darkness gradient overlay & text details on bottom left */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5 text-left">
                  <div className="max-w-[80%] pb-1">
                    <h3 className="text-[15px] font-black text-white tracking-tight leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {note.title}
                    </h3>
                    <p className="text-[11px] font-medium text-white/80 mt-0.5 truncate drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.4)]">
                      {note.description || "Lecture notes"}
                    </p>
                  </div>
                </div>

                {/* 3. Dark semitranslucent sequence stamp in bottom right */}
                <div className="absolute bottom-5 right-5 flex items-center justify-center h-[22px] px-2.5 rounded bg-black/45 backdrop-blur-xs select-none border border-white/5">
                  <span className="text-[10px] font-black text-white font-sans tracking-wider">
                    {formattedIndex}
                  </span>
                </div>

                {/* 4. Action bar for manipulation (shows elegantly on hover) - only for Course Representatives */}
                {isCourseRep && (
                  <div 
                    className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded border border-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button
                      onClick={() => onReorderNote(note.id, 'up')}
                      className="p-1 rounded hover:bg-white/20 text-white transition-colors"
                      title="Move sequence up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderNote(note.id, 'down')}
                      className="p-1 rounded hover:bg-white/20 text-white transition-colors"
                      title="Move sequence down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this lecture snapshot?')) {
                          onDeleteNote(note.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-red-500/30 hover:text-red-400 text-slate-300 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
