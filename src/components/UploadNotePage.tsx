import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Trash2, Menu, Search, Sparkles } from 'lucide-react';
import { Course, Note } from '../types';
import { performOcr } from '../utils/ocr';
import { compressImage } from '../utils/imageCompressor';

interface UploadNotePageProps {
  courses: Course[];
  activeCourseId?: string;
  onSave: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  suggestedOrderForCourse: (courseId: string) => number;
  onAddNewCourseTrigger: () => void;
}

export default function UploadNotePage({
  courses,
  activeCourseId,
  onSave,
  suggestedOrderForCourse,
  onAddNewCourseTrigger,
}: UploadNotePageProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Live Tesseract engine state trackers
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);

  const runOcrOnImage = async (imageSrc: string, imageName: string) => {
    setIsOcrRunning(true);
    setOcrProgress(5);
    setOcrStatusText('Booting up local Tesseract engine...');

    try {
      const textResult = await performOcr(imageSrc, (percent, label) => {
        setOcrProgress(percent);
        setOcrStatusText(label);
      });

      // Extract raw first headline line
      if (textResult && textResult.trim()) {
        const lines = textResult.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 2);

        if (lines.length > 0) {
          let detectedHeadline = lines[0];
          // Strip brackets or multiple specials
          detectedHeadline = detectedHeadline.replace(/[^\w\s-]/g, '').trim();
          if (detectedHeadline.length > 35) {
            detectedHeadline = detectedHeadline.slice(0, 32) + '...';
          }
          // Capitalize first letter beautifully
          detectedHeadline = detectedHeadline.charAt(0).toUpperCase() + detectedHeadline.slice(1);

          setTitle(detectedHeadline);
          // Try to extract some body descriptors if there are more lines
          if (lines.length > 1 && !description) {
            const extraText = lines.slice(1, 4).join(' ');
            if (extraText.length > 5) {
              setDescription(extraText.slice(0, 60));
            }
          }
        } else {
          // Generate nice human-readable file fallback name
          const cleanName = imageName.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
          const fallbackTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          setTitle(fallbackTitle);
        }
      } else {
        const cleanName = imageName.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
        const fallbackTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        setTitle(fallbackTitle);
      }
    } catch (err: any) {
      console.warn('OCR error:', err);
      const fallbackTitle = imageName ? imageName.replace(/\.[^/.]+$/, "") : `Lecture Note ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const capitalizedTitle = fallbackTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setTitle(capitalizedTitle);
    } finally {
      setIsOcrRunning(false);
      setOcrProgress(100);
      setOcrStatusText('');
    }
  };

  const handleRunOcrOnFirstImage = async () => {
    if (imageFiles.length === 0) {
      alert('Attach or drop an image note to perform OCR first!');
      return;
    }
    await runOcrOnImage(imageFiles[0].dataUrl, imageFiles[0].name);
  };

  // Initialize with exactly 1 default preview image as requested
  const [imageFiles, setImageFiles] = useState<{ name: string; type: string; dataUrl: string }[]>([
    {
      name: 'beakers.jpg',
      type: 'image/jpeg',
      dataUrl: 'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=800',
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize dynamic default course or order selection on mount or route transition
  useEffect(() => {
    const defaultCourseId = activeCourseId || (courses.length > 0 ? courses[0].id : '');
    setSelectedCourseId(defaultCourseId);
    setTitle('');
    setDescription('');
  }, [activeCourseId, courses]);

  // Adjust sequence helper order number dynamically when the selected binder changes
  useEffect(() => {
    if (selectedCourseId) {
      setOrder(suggestedOrderForCourse(selectedCourseId));
    }
  }, [selectedCourseId, suggestedOrderForCourse]);

  const handleFiles = (files: FileList) => {
    const list = Array.from(files);
    list.forEach((file, idx) => {
      if (!file.type.startsWith('image/')) {
        alert('Only lecture note screenshots or image whiteboard photos can be uploaded!');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const rawDataUrl = e.target.result as string;
          try {
            // Compress the image down immediately
            const dataUrl = await compressImage(rawDataUrl, 800, 800, 0.7);
            setImageFiles((prev) => [
              ...prev,
              {
                name: file.name,
                type: 'image/jpeg',
                dataUrl,
              },
            ]);

            // Automatically extract first headline from the first file in the uploaded set
            if (idx === 0) {
              runOcrOnImage(dataUrl, file.name);
            }
          } catch (compressError) {
            console.warn('Image compression fallback:', compressError);
            setImageFiles((prev) => [
              ...prev,
              {
                name: file.name,
                type: file.type,
                dataUrl: rawDataUrl,
              },
            ]);
            if (idx === 0) {
              runOcrOnImage(rawDataUrl, file.name);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select or create a course notebook folder first!');
      return;
    }
    if (imageFiles.length === 0) {
      alert('Please snap or drop at least one lecture note image.');
      return;
    }

    const finalTitle = title.trim() || `Lecture Snap #${order}`;
    const imagesToSave = imageFiles.map((i) => i.dataUrl);

    onSave({
      courseId: selectedCourseId,
      title: finalTitle,
      order: Number(order) || 1,
      images: imagesToSave,
      description: description.trim(),
      ocrText: '',
      ocrStatus: 'idle',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] font-sans pb-16">
      
      {/* Top Header Row modeled exactly after Image 3 */}
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-3 font-sans shrink-0 -mx-5 px-5 mb-5">
        <button
          type="button"
          className="p-1 rounded text-zinc-700 hover:bg-slate-100/80 transition-all cursor-pointer"
        >
          <Menu className="h-5 w-5 stroke-[2.5]" />
        </button>

        <h1 className="text-lg font-black tracking-tight text-[#2c50cd] font-sans">
          Decker
        </h1>

        <button
          type="button"
          className="p-1 rounded text-zinc-700 hover:bg-slate-100/80 transition-all cursor-pointer"
        >
          <Search className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>
      
      {/* Scrollable Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        
        {/* Header Title Section matches mockup style */}
        <div>
          <h2 className="text-[28px] font-extrabold text-[#191c1d] tracking-tight leading-tight font-sans">
            Upload Note
          </h2>
          <p className="text-[13px] text-slate-500 font-medium mt-1 font-sans">
            Add new materials to your study deck.
          </p>
        </div>

        {/* Select Course pills row */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
            Select Course
          </label>
          <div className="flex flex-wrap gap-2.5">
            {courses.map((course) => {
              const isSelected = selectedCourseId === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all border font-sans select-none cursor-pointer ${
                    isSelected
                      ? 'border-[#2c50cd] bg-[#eef2ff] text-[#2c50cd]'
                      : 'border-slate-200/90 bg-white text-[#444654] hover:bg-slate-50'
                  }`}
                >
                  {course.code || course.name}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onAddNewCourseTrigger}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold border border-dashed border-[#2c50cd] bg-white text-[#2c50cd] hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Course</span>
            </button>
          </div>
        </div>

        {/* Input Title field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
              Input Title
            </label>
            {imageFiles.length > 0 && (
              <button
                type="button"
                onClick={handleRunOcrOnFirstImage}
                disabled={isOcrRunning}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2c50cd] hover:text-[#1e3bb5] transition-colors bg-blue-50/60 px-2.5 py-1 rounded-md border border-blue-100 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 stroke-[2.5] text-[#2c50cd] animate-pulse" />
                <span>{isOcrRunning ? 'Scanning...' : 'Auto-Extract Headline via OCR'}</span>
              </button>
            )}
          </div>
          
          <input
            type="text"
            placeholder="e.g., Cell Mitosis Diagram"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl bg-[#f4f5f6] px-5 py-4 text-xs text-ink placeholder-[#717377] outline-none transition-all focus:bg-white focus:ring-1 focus:ring-brand/10 border border-transparent focus:border-brand/30 font-sans font-medium"
          />

          {/* Real-time OCR Engine Running Progress Panel */}
          {isOcrRunning && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-2 animate-pulse">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 font-sans">
                <span className="flex items-center gap-1.5 text-[#2c50cd]">
                  <span className="h-2 w-2 rounded-full bg-[#2c50cd] animate-ping" />
                  {ocrStatusText || 'Recognizing text pixels...'}
                </span>
                <span className="font-mono text-[#2c50cd]">{ocrProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="bg-[#2c50cd] h-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sequence position indicators */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
            Order Number
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              required
              value={order}
              onChange={(e) => setOrder(Math.max(1, Number(e.target.value)))}
              className="w-16 text-center rounded-2xl bg-[#f4f5f6] py-3.5 text-xs font-black text-ink outline-none transition-all focus:bg-white border border-transparent focus:border-brand/30 font-sans"
            />
            <span className="text-[11px] text-[#444654] font-semibold font-sans">
              Suggested next in sequence
            </span>
          </div>
        </div>

        {/* Dash Photo Dropper Block */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
            Upload Image(s)
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-9 px-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand bg-brand/5'
                : 'border-[#cacad2] hover:border-brand/60 hover:bg-slate-50/50 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />
            
            {/* Camera Plus Custom Icon */}
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff] text-[#2c50cd]">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
                <line x1="18" y1="13" x2="20" y2="13" />
                <line x1="19" y1="12" x2="19" y2="14" />
              </svg>
            </div>
            
            <div>
              <span className="text-xs font-black text-[#191c1d] block font-sans">
                Tap to select or drag & drop
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-tight mt-1 block font-sans">
                PNG, JPG or PDF (max 10MB)
              </span>
            </div>
          </div>
        </div>

        {/* Selected image previews */}
        {imageFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            {imageFiles.map((file, idx) => (
              <div key={idx} className="group relative aspect-square rounded-2xl bg-neutral-100/50 overflow-hidden border border-slate-200/50 shadow-xs">
                <img src={file.dataUrl} alt="Preview" className="h-full w-full object-cover select-none" />
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    className="rounded-lg bg-red-600 px-3.5 py-2 text-[10px] font-extrabold text-white hover:bg-red-700 cursor-pointer transition-colors shadow-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Description caption */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
            Description / Notes (Optional)
          </label>
          <textarea
            placeholder="e.g., Key whiteboard sketches from Monday's lecture."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl bg-[#f4f5f6] px-5 py-4 text-xs text-ink placeholder-[#717377] outline-none transition-all focus:bg-white focus:ring-1 focus:ring-brand/10 border border-transparent focus:border-brand/30 resize-none font-sans font-medium"
          />
        </div>

        {/* High-fidelity primary Save action button */}
        <div className="pt-3 pb-8">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand hover:bg-brand-hover py-4.5 text-xs font-extrabold text-white transition-all shadow-[0_4px_12px_rgba(44,80,205,0.25)] hover:shadow-[0_6px_16px_rgba(44,80,205,0.35)] cursor-pointer text-center font-sans tracking-wide"
          >
            Save Note
          </button>
        </div>

      </form>
    </div>
  );
}
