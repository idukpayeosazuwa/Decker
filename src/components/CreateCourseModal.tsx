import React, { useState } from 'react';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { Course } from '../types';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Omit<Course, 'id' | 'createdAt'>) => void;
}

const NOTEBOOK_COLORS = [
  { name: 'indigo', label: 'Classic Indigo', class: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100', dot: 'bg-indigo-500' },
  { name: 'emerald', label: 'Forest Green', class: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-500' },
  { name: 'amber', label: 'Vintage Amber', class: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100', dot: 'bg-amber-500' },
  { name: 'rose', label: 'Crimson Rose', class: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100', dot: 'bg-rose-500' },
  { name: 'purple', label: 'Royal Violet', class: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100', dot: 'bg-purple-500' },
  { name: 'cyan', label: 'Arctic Cyan', class: 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100', dot: 'bg-cyan-500' },
  { name: 'fuchsia', label: 'Deep Fuchsia', class: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100', dot: 'bg-fuchsia-500' },
  { name: 'slate', label: 'Slate Charcoal', class: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100', dot: 'bg-slate-500' },
];

export default function CreateCourseModal({ isOpen, onClose, onSave }: CreateCourseModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a course booklet name.');
      return;
    }
    setError('');
    const colors = ['indigo', 'emerald', 'amber', 'rose', 'purple', 'cyan', 'fuchsia', 'slate'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color: randomColor,
    });
    setName('');
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Back-shading Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog Content Container */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all font-sans border border-slate-200">
        
        {/* Top Header Row status */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 rounded bg-slate-100 uppercase font-mono text-[10px] text-slate-500 font-bold tracking-wider">
              New Notebook
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-txt font-mono mb-1">
              Notebook Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Computer Systems Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-xs text-ink placeholder-slate-400 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-txt font-mono mb-1">
              Class/Notebook Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., CS-501"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-xs text-ink placeholder-slate-400 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10 bg-white"
            />
          </div>

          {error && (
            <div className="text-[11px] text-rose-500 font-semibold bg-rose-50 p-2 rounded border border-rose-100 font-mono">
              {error}
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 rounded bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover transition-all cursor-pointer"
            >
              <span>Create</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
