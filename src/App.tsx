import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Layers, 
  Search, 
  Calendar, 
  HelpCircle,
  Clock,
  Menu,
  Home,
  Camera,
  User,
  X,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Course, Note } from './types';
import { initialCourses, initialNotes } from './utils/mockData';
import CreateCourseModal from './components/CreateCourseModal';
import UploadNotePage from './components/UploadNotePage';
import CourseNotebookView from './components/CourseNotebookView';
import NoteViewer from './components/NoteViewer';
import LoginPage from './components/LoginPage';
import { 
  isFirebaseActive, 
  subscribeCourses, 
  subscribeNotes, 
  saveCourse, 
  saveNote, 
  removeCourse, 
  removeNote,
  logoutSession
} from './lib/firebaseWrapper';

interface UserSession {
  uid: string;
  email: string;
  role: 'rep';
}

export default function App() {
  // Session details
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('decker_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'upload'>('home');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Course list synchronized in real-time
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Note list synchronized in real-time for selected course
  const [notes, setNotes] = useState<Note[]>([]);

  // State controllers
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  // Modals status
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Sync session details locally
  useEffect(() => {
    if (userSession) {
      localStorage.setItem('decker_user_session', JSON.stringify(userSession));
    } else {
      localStorage.removeItem('decker_user_session');
    }
  }, [userSession]);

  // Real-time synchronization of Courses (unrestricted for guests)
  useEffect(() => {
    const unsubscribe = subscribeCourses((data) => {
      // Seed with initialMock data if completely empty and in Local mode
      if (data.length === 0 && !isFirebaseActive) {
        localStorage.setItem('decker_courses', JSON.stringify(initialCourses));
        localStorage.setItem('decker_notes', JSON.stringify(initialNotes));
        setCourses(initialCourses);
      } else {
        setCourses(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time synchronization of Notes for active Notebook (unrestricted for guests)
  useEffect(() => {
    if (selectedCourseId) {
      const unsubscribe = subscribeNotes(selectedCourseId, (data) => {
        setNotes(data);
      });
      return () => unsubscribe();
    } else {
      // Sub collection list is empty if no active booklet selected
      setNotes([]);
    }
  }, [selectedCourseId]);

  const handleLogout = async () => {
    await logoutSession();
    setUserSession(null);
    setSelectedCourseId(null);
    setActiveTab('home');
  };

  // Actions wrapped to sync with real Firebase backend or LocalStorage fallbacks
  const handleCreateCourse = async (courseData: Omit<Course, 'id' | 'createdAt'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      createdAt: new Date().toISOString(),
      notesCount: 0
    };
    await saveCourse(newCourse);
    setIsCreateCourseOpen(false);
  };

  const handleNewBinderClick = () => {
    if (!userSession) {
      setIsLoginOpen(true);
    } else {
      setIsCreateCourseOpen(true);
    }
  };

  const handleUploadNote = async (noteData: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    // Save compressed base64 image locally in localStorage to ensure 100% display fallback
    if (newNote.images && newNote.images[0]) {
      try {
        localStorage.setItem(`decker_cache_image_${newNote.id}`, newNote.images[0]);
      } catch (e) {
        console.warn('LocalStorage image caching failed:', e);
      }
    }
    
    await saveNote(newNote);

    // Update noteCount inside Course booklet schema
    const course = courses.find(c => c.id === noteData.courseId);
    if (course) {
      const updatedCourse = {
        ...course,
        notesCount: (course.notesCount || 0) + 1
      };
      await saveCourse(updatedCourse);
    }
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!userSession) {
      setIsLoginOpen(true);
      return;
    }
    if (!confirm('Warning: Deleting this course notebook will permanently wipe all attached lecture slides. Proceed?')) {
      return;
    }

    await removeCourse(courseId);
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedCourseId) return;
    await removeNote(selectedCourseId, noteId);
    
    // Decrement count
    const course = courses.find(c => c.id === selectedCourseId);
    if (course) {
      const updatedCourse = {
        ...course,
        notesCount: Math.max(0, (course.notesCount || 0) - 1)
      };
      await saveCourse(updatedCourse);
    }

    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
  };

  const handleReorderNote = async (noteId: string, direction: 'up' | 'down') => {
    const index = notes.findIndex(n => n.id === noteId);
    if (index === -1) return;

    const courseNotes = [...notes].sort((a,b) => a.order - b.order);
    const sortedIndex = courseNotes.findIndex(n => n.id === noteId);

    if (direction === 'up' && sortedIndex > 0) {
      const prevNote = courseNotes[sortedIndex - 1];
      const temp = courseNotes[sortedIndex].order;
      courseNotes[sortedIndex].order = prevNote.order;
      prevNote.order = temp;
    } else if (direction === 'down' && sortedIndex < courseNotes.length - 1) {
      const nextNote = courseNotes[sortedIndex + 1];
      const temp = courseNotes[sortedIndex].order;
      courseNotes[sortedIndex].order = nextNote.order;
      nextNote.order = temp;
    }

    // Rewrite sorted sequence order in sync with database
    const sortedReseq = [...courseNotes].sort((a,b) => a.order - b.order);
    sortedReseq.forEach((n, idx) => {
      n.order = idx + 1;
    });

    for (const note of sortedReseq) {
      await saveNote(note);
    }
  };

  // Get notes count dynamically supporting fallback
  const getNoteCount = (course: Course): number => {
    if (isFirebaseActive) {
      return course.notesCount || 0;
    } else {
      // Count local json list
      const localNotesStr = localStorage.getItem('decker_notes') || '[]';
      const localNotes: Note[] = JSON.parse(localNotesStr);
      return localNotes.filter(n => n.courseId === course.id).length;
    }
  };

  // Suggestions for sequential notes insertion
  const getSuggestedOrderForCourse = (courseId: string) => {
    if (isFirebaseActive) {
      if (notes.length === 0) return 1;
      const maxOrder = Math.max(...notes.map(n => n.order));
      return maxOrder + 1;
    } else {
      const localNotesStr = localStorage.getItem('decker_notes') || '[]';
      const localNotes: Note[] = JSON.parse(localNotesStr);
      const filtered = localNotes.filter(n => n.courseId === courseId);
      if (filtered.length === 0) return 1;
      const maxOrder = Math.max(...filtered.map(n => n.order));
      return maxOrder + 1;
    }
  };

  // Lightbox carousel controllers
  const handleNextNote = () => {
    if (!activeNote) return;
    const sorted = [...notes].sort((a,b) => a.order - b.order);
    const currIndex = sorted.findIndex(n => n.id === activeNote.id);
    if (currIndex !== -1 && currIndex < sorted.length - 1) {
      setActiveNote(sorted[currIndex + 1]);
    }
  };

  const handlePrevNote = () => {
    if (!activeNote) return;
    const sorted = [...notes].sort((a,b) => a.order - b.order);
    const currIndex = sorted.findIndex(n => n.id === activeNote.id);
    if (currIndex > 0) {
      setActiveNote(sorted[currIndex - 1]);
    }
  };

  const getActiveNoteNavInfo = () => {
    if (!activeNote) return { hasPrev: false, hasNext: false };
    const sorted = [...notes].sort((a,b) => a.order - b.order);
    const idx = sorted.findIndex(n => n.id === activeNote.id);
    return {
      hasPrev: idx > 0,
      hasNext: idx !== -1 && idx < sorted.length - 1
    };
  };

  const { hasPrev, hasNext } = getActiveNoteNavInfo();
  const currentViewedCourse = activeNote ? courses.find(c => c.id === activeNote.courseId) : undefined;

  // Filter courses list by search input (no department restrictions in simplified rep mode)
  const filteredCourses = courses.filter(c => {
    return (
      c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(courseSearchQuery.toLowerCase()))
    );
  });

  // Cover background graphics
  const coverColors: Record<string, string> = {
    indigo: 'bg-gradient-to-br from-[#3956bf] to-[#20378e]',
    emerald: 'bg-gradient-to-br from-[#0f5132] to-[#042013]',
    amber: 'bg-gradient-to-br from-[#8d4b00] to-[#512700]',
    rose: 'bg-gradient-to-br from-[#ba1a1a] to-[#730a0a]',
    purple: 'bg-gradient-to-br from-[#5e35b1] to-[#311762]',
    cyan: 'bg-gradient-to-br from-[#00838f] to-[#004d56]',
    fuchsia: 'bg-gradient-to-br from-[#880e4f] to-[#4c0027]',
    slate: 'bg-gradient-to-br from-[#2e3132] to-[#121414]'
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 flex items-center justify-center p-0 md:p-6 antialiased font-sans">
      
      {/* Sleek Mobile Device Container */}
      <div className="w-full max-w-md bg-white min-h-screen md:min-h-[800px] md:max-h-[85vh] md:rounded-[36px] md:shadow-2xl md:border-[10px] md:border-slate-900 overflow-hidden flex flex-col relative">
        
        {/* Main Content viewport with native scroll behavior */}
        <div className={`flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-[#FAF9F5] ${userSession ? 'pb-24' : 'pb-10'}`}>
          
          {/* VIEW 1: HOME TAB (STUDY DESK & GENERAL INDEX) */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Navbar exact matching provided design with military precision */}
              <div className="flex items-center justify-between pb-3 pt-1 font-sans border-b border-slate-100/60" id="decker-top-navbar">
                {/* Left: Hamburger menu icon + brand 'Decker' next to it */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Menu"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100/60 active:scale-95 transition-all cursor-pointer"
                  >
                    <Menu className="h-5.5 w-5.5 stroke-[2.2]" />
                  </button>
                  <span className="text-xl font-black tracking-tight text-[#2c50cd] font-sans">
                    Decker
                  </span>
                </div>

                {/* Right: Search icon + circular avatar badge 'us' */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                      if (searchInput) {
                        searchInput.focus();
                        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    title="Focus search binders"
                    className="p-1.5 rounded-full text-slate-700 hover:bg-slate-100/60 active:scale-95 transition-all cursor-pointer"
                  >
                    <Search className="h-5.5 w-5.5 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!userSession) {
                        setIsLoginOpen(true);
                      } else {
                        if (confirm('Active Representative session. Logout?')) {
                          handleLogout();
                        }
                      }
                    }}
                    title={userSession ? "Representative Session (Click to Sign Out)" : "Representative Sign In"}
                    className="h-8 w-8 rounded-full bg-[#3b5beb] hover:bg-[#2c50cd] text-white font-extrabold text-[12px] flex items-center justify-center font-sans tracking-tight transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  >
                    us
                  </button>
                </div>
              </div>

              {/* Minimalist Search Bar modeled after Image 3 */}
              <div className="relative pt-1 shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-1">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search binders..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-[#F3F4F6]/40 py-2.5 pl-9 pr-4 text-xs text-[#191c1d] placeholder-slate-450 outline-none transition-all focus:border-brand/50 focus:bg-white focus:ring-1 focus:ring-brand/10 bg-white"
                />
              </div>

              {/* Title Section */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-sm font-extrabold text-[#191c1d] tracking-tight font-sans">
                    Course Binders
                  </h2>
                </div>
                {userSession && (
                  <button
                    onClick={handleNewBinderClick}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200/80 border border-slate-200/55 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-[#2c50cd] stroke-[2.5]" />
                    <span>New Binder</span>
                  </button>
                )}
              </div>

              {/* Grid of beautifully bound physical design courses */}
              {filteredCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                  <BookOpen className="mx-auto h-7 w-7 text-neutral-300 mb-2" />
                  <h3 className="text-xs font-bold text-slate-800">No Course Binders</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Class binders will display here chronologically as they are published.</p>
                  {userSession && (
                    <button
                      onClick={handleNewBinderClick}
                      className="mt-3 inline-flex items-center gap-1.5 rounded bg-[#2c50cd] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1e3bb5] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Binder</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 pt-1">
                  {filteredCourses.map((course) => {
                    const noteCount = getNoteCount(course);
                    const coverBg = coverColors[course.color || 'slate'] || 'bg-slate-600';

                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveTab('courses');
                        }}
                        className="group flex flex-col rounded-xl border border-[#F3F4F6] bg-white overflow-hidden hover:border-[#2c50cd]/35 hover:shadow-md transition-all duration-200 cursor-pointer text-left shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                      >
                        {/* Header color banner cover */}
                        <div className={`h-24 ${coverBg} relative p-4 flex flex-col justify-between`}>
                          <span className="bg-white/20 backdrop-blur-xs text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded-sm self-start uppercase tracking-wider">
                            {course.code || 'CSCODE'}
                          </span>
                          
                          {userSession && (
                            <button
                              onClick={(e) => handleDeleteCourse(course.id, e)}
                              className="absolute top-4 right-4 rounded p-1 bg-black/15 text-white/80 hover:bg-black/30 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Delete Binder"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Text payload area */}
                        <div className="p-4 flex-1 flex flex-col justify-between font-sans">
                          <div>
                            <h3 className="text-xs font-extrabold text-[#191c1d] tracking-tight font-sans">
                              {course.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans uppercase tracking-wider">
                              Academic Binder
                            </p>
                          </div>

                          <div className="pt-3.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans">
                            <span className="text-[#2c50cd] font-semibold">
                              📄 {noteCount} {noteCount === 1 ? 'slide' : 'slides'}
                            </span>
                            <span className="text-slate-400 font-medium">
                              Sequential index
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* VIEW 2: COURSES TAB (notebook details or prompt lookup) */}
          {activeTab === 'courses' && (
            <div className="h-full animate-fade-in">
              {selectedCourseId !== null ? (
                (() => {
                  const course = courses.find((c) => c.id === selectedCourseId);
                  if (!course) {
                    setSelectedCourseId(null);
                    return null;
                  }
                  return (
                    <CourseNotebookView
                      course={course}
                      notes={notes}
                      onBack={() => {
                        setSelectedCourseId(null);
                        setActiveTab('home');
                      }}
                      onUploadClick={() => setActiveTab('upload')}
                      onNoteClick={(note) => setActiveNote(note)}
                      onReorderNote={handleReorderNote}
                      onDeleteNote={handleDeleteNote}
                      isCourseRep={!!userSession}
                    />
                  );
                })()
              ) : (
                <div className="space-y-4 text-center py-10 font-sans">
                  <BookOpen className="mx-auto h-9 w-9 text-slate-300" />
                  <h3 className="text-xs font-bold text-zinc-800">Select a Notebook</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Return to the home tab or select any class booklet to index handwritten drawings sequentially.
                  </p>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#2c50cd] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1e3bb5] tracking-tight cursor-pointer shadow-xs"
                  >
                    <span>Browse Study Booklets</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: UPLOAD TAB (integrated camera upload view - rep option) */}
          {activeTab === 'upload' && (
            <div className="h-full animate-fade-in">
              {!userSession ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-4 font-sans text-slate-700">
                  <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mb-1 text-[#2c50cd]">
                    <Camera className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#191c1d]">Representative Sign In Required</h3>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    To upload visual whiteboard snapshots, organize class notes chronologically, or submit lecture sequences, please authenticate as a study representative.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLoginOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-[#2c50cd] hover:bg-[#1e3bb5] text-white font-bold text-xs py-2.5 px-6 cursor-pointer shadow-xs transition-colors"
                  >
                    Sign In as Representative
                  </button>
                </div>
              ) : (
                <UploadNotePage
                  courses={filteredCourses}
                  activeCourseId={selectedCourseId || undefined}
                  onSave={(noteData) => {
                    handleUploadNote(noteData);
                    setSelectedCourseId(noteData.courseId);
                    setActiveTab('courses'); // Forward straight to chronological deck view
                  }}
                  suggestedOrderForCourse={getSuggestedOrderForCourse}
                  onAddNewCourseTrigger={handleNewBinderClick}
                />
              )}
            </div>
          )}
        </div>

        {/* --- Dynamic Floating Action Button (FAB) inside container --- */}
        {userSession && activeTab !== 'upload' && (
          <button
            onClick={() => setActiveTab('upload')}
            id="fab-add-note"
            className="absolute bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2c50cd] text-white shadow-[0_4px_20px_rgba(44,80,205,0.3)] hover:bg-[#1e3bb5] active:scale-95 transition-all cursor-pointer border border-white/10"
            title="Upload slide snapshot"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        )}

        {/* --- Unified bottom mobile navigation tab bar --- */}
        {userSession && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/60 flex items-center justify-around px-2 z-30 shrink-0 select-none animate-fade-in">
            <button
              onClick={() => { setActiveTab('home'); setSelectedCourseId(null); }}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'home' || activeTab === 'courses' ? 'text-[#2c50cd]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="h-5 w-5 stroke-[2]" />
              <span className="text-[10px] font-bold tracking-tight">Home</span>
            </button>
            
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'upload' ? 'text-[#2c50cd]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Camera className="h-5 w-5 stroke-[2]" />
              <span className="text-[10px] font-bold tracking-tight font-sans">Upload</span>
            </button>
          </div>
        )}

        {/* --- Overlay Dialogs & Lightboxes --- */}
        
        {/* 1. New Notebook Creator Modal */}
        <CreateCourseModal
          isOpen={isCreateCourseOpen}
          onClose={() => setIsCreateCourseOpen(false)}
          onSave={handleCreateCourse}
        />

        {/* 2. Slide Carousel Lightbox viewer */}
        {activeNote && (() => {
          const activeIndex = notes.findIndex(n => n.id === activeNote.id);
          return (
            <NoteViewer
              note={activeNote}
              course={currentViewedCourse}
              onClose={() => setActiveNote(null)}
              onNext={hasNext ? handleNextNote : undefined}
              onPrev={hasPrev ? handlePrevNote : undefined}
              onDelete={handleDeleteNote}
              hasPrev={hasPrev}
              hasNext={hasNext}
              currentIndex={activeIndex !== -1 ? activeIndex : 0}
              totalNotes={notes.length > 0 ? notes.length : 1}
              isCourseRep={!!userSession}
            />
          );
        })()}

        {/* 3. Sliding / Full-screen custom login overlay */}
        {isLoginOpen && (
          <div className="absolute inset-0 z-50 bg-[#FAF9F5] flex flex-col animate-fade-in text-left">
            <LoginPage 
              onLogin={(session) => {
                setUserSession(session);
                setIsLoginOpen(false);
              }} 
              onClose={() => setIsLoginOpen(false)}
            />
          </div>
        )}

      </div>
    </div>
  );
}
