import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { Course, Note } from '../types';

// Check if credentials are placeholders or if it is real
const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('PLACEHOLDER');

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    storage = getStorage(app);
    console.log("Real Firebase initialized successfully with Storage support!");
  } catch (error) {
    console.error("Failed to initialize Firebase with real credentials, falling back to local mode:", error);
  }
}

export const isFirebaseActive = !!db && !!auth;

// Custom errors helper mapped to Firebase Integration guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Global Auth Providers
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage };

// Interface for Decker session
export interface DeckerUser {
  uid: string;
  email: string;
  role: 'rep'; // Everyone authenticated is a representative in simplified model
}

/**
 * Perform Sign In (or fallback to mock)
 */
export async function loginUser(email: string, password: string): Promise<DeckerUser> {
  if (isFirebaseActive) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: credential.user.uid,
        email: credential.user.email || email,
        role: 'rep'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  } else {
    // Local storage fallback login simulation
    const savedUsers = JSON.parse(localStorage.getItem('decker_mock_users') || '[]');
    const user = savedUsers.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      // In mock mode, let's create the user if not exists to facilitate very low friction testing!
      const mockNewUser = { uid: `mock-${Date.now()}`, email, password };
      savedUsers.push(mockNewUser);
      localStorage.setItem('decker_mock_users', JSON.stringify(savedUsers));
      return {
        uid: mockNewUser.uid,
        email: mockNewUser.email,
        role: 'rep'
      };
    }
    return {
      uid: user.uid,
      email: user.email,
      role: 'rep'
    };
  }
}

/**
 * Perform Sign Up registration (or fallback to mock)
 */
export async function registerUser(email: string, password: string): Promise<DeckerUser> {
  if (isFirebaseActive) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        uid: credential.user.uid,
        email: credential.user.email || email,
        role: 'rep'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  } else {
    const savedUsers = JSON.parse(localStorage.getItem('decker_mock_users') || '[]');
    if (savedUsers.some((u: any) => u.email === email)) {
      throw new Error('This email is already registered.');
    }
    const mockNewUser = { uid: `mock-${Date.now()}`, email, password };
    savedUsers.push(mockNewUser);
    localStorage.setItem('decker_mock_users', JSON.stringify(savedUsers));
    return {
      uid: mockNewUser.uid,
      email: mockNewUser.email,
      role: 'rep'
    };
  }
}

/**
 * Google Sign In
 */
export async function loginWithGoogle(): Promise<DeckerUser> {
  if (isFirebaseActive) {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return {
        uid: credential.user.uid,
        email: credential.user.email || '',
        role: 'rep'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Google authentication failed');
    }
  } else {
    // Beautiful mock identity connection
    return {
      uid: `mock-google-${Date.now()}`,
      email: 'student.services@decker.edu',
      role: 'rep'
    };
  }
}

/**
 * Sign Out
 */
export async function logoutSession(): Promise<void> {
  if (isFirebaseActive) {
    await signOut(auth);
  }
}

/**
 * REALTIME LISTENER OR LOCAL CALLBACK FOR COURSES
 */
export function subscribeCourses(onUpdate: (courses: Course[]) => void, onError?: (err: any) => void) {
  if (isFirebaseActive) {
    const pathRef = 'courses';
    const q = query(collection(db, pathRef), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const fetched: Course[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as Course);
      });
      onUpdate(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathRef);
      if (onError) onError(error);
    });
  } else {
    // Trigger immediately with whatever is in localstorage
    const localCoursesStr = localStorage.getItem('decker_courses');
    const localCourses = localCoursesStr ? JSON.parse(localCoursesStr) : [];
    onUpdate(localCourses);
    // Return empty unsubscribe function
    return () => {};
  }
}

/**
 * REALTIME LISTENER OR LOCAL CALLBACK FOR SEQUENTIAL NOTES
 */
export function subscribeNotes(courseId: string, onUpdate: (notes: Note[]) => void, onError?: (err: any) => void) {
  if (isFirebaseActive) {
    const pathRef = `courses/${courseId}/notes`;
    const q = query(collection(db, pathRef), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const fetched: Note[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as Note);
      });
      onUpdate(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathRef);
      if (onError) onError(error);
    });
  } else {
    const localNotesStr = localStorage.getItem('decker_notes');
    const localNotes: Note[] = localNotesStr ? JSON.parse(localNotesStr) : [];
    const filtered = localNotes.filter(n => n.courseId === courseId).sort((a, b) => a.order - b.order);
    onUpdate(filtered);
    return () => {};
  }
}

/**
 * SAVE OR UPDATE COURSE
 */
export async function saveCourse(course: Course): Promise<void> {
  if (isFirebaseActive) {
    const path = `courses/${course.id}`;
    try {
      await setDoc(doc(db, 'courses', course.id), course);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    const localCoursesStr = localStorage.getItem('decker_courses');
    const courses: Course[] = localCoursesStr ? JSON.parse(localCoursesStr) : [];
    const index = courses.findIndex(c => c.id === course.id);
    if (index !== -1) {
      courses[index] = course;
    } else {
      courses.unshift(course);
    }
    localStorage.setItem('decker_courses', JSON.stringify(courses));
  }
}

/**
 * SAVE OR UPDATE NOTE
 */
export async function saveNote(note: Note): Promise<void> {
  if (isFirebaseActive) {
    const path = `courses/${note.courseId}/notes/${note.id}`;
    try {
      const uploadedImages: string[] = [];
      if (note.images && note.images.length > 0) {
        for (let i = 0; i < note.images.length; i++) {
          const img = note.images[i];
          if (img && typeof img === 'string') {
            if (img.startsWith('data:')) {
              try {
                const mimeMatch = img.match(/^data:([^;]+);/);
                const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                const fileRef = ref(storage, `courses/${note.courseId}/notes/${note.id}/image_${i}_${Date.now()}`);
                await uploadString(fileRef, img, 'data_url', { contentType });
                const downloadUrl = await getDownloadURL(fileRef);
                uploadedImages.push(downloadUrl);
              } catch (storageErr) {
                console.error('Failed to upload image to Firebase Storage, keeping local dataUrl:', storageErr);
                uploadedImages.push(img);
              }
            } else {
              uploadedImages.push(img);
            }
          }
        }
      }

      const noteToSave: Note = {
        ...note,
        images: uploadedImages
      };

      await setDoc(doc(db, 'courses', note.courseId, 'notes', note.id), noteToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    const localNotesStr = localStorage.getItem('decker_notes');
    const notes: Note[] = localNotesStr ? JSON.parse(localNotesStr) : [];
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index] = note;
    } else {
      notes.push(note);
    }
    localStorage.setItem('decker_notes', JSON.stringify(notes));
  }
}

/**
 * DELETE COURSE
 */
export async function removeCourse(courseId: string): Promise<void> {
  if (isFirebaseActive) {
    const path = `courses/${courseId}`;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const localCoursesStr = localStorage.getItem('decker_courses');
    const courses: Course[] = localCoursesStr ? JSON.parse(localCoursesStr) : [];
    const updated = courses.filter(c => c.id !== courseId);
    localStorage.setItem('decker_courses', JSON.stringify(updated));

    // Cleanup notes as well
    const localNotesStr = localStorage.getItem('decker_notes');
    const notes: Note[] = localNotesStr ? JSON.parse(localNotesStr) : [];
    const updatedNotes = notes.filter(n => n.courseId !== courseId);
    localStorage.setItem('decker_notes', JSON.stringify(updatedNotes));
  }
}

/**
 * DELETE NOTE
 */
export async function removeNote(courseId: string, noteId: string): Promise<void> {
  if (isFirebaseActive) {
    const path = `courses/${courseId}/notes/${noteId}`;
    try {
      await deleteDoc(doc(db, 'courses', courseId, 'notes', noteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const localNotesStr = localStorage.getItem('decker_notes');
    const notes: Note[] = localNotesStr ? JSON.parse(localNotesStr) : [];
    const updated = notes.filter(n => n.id !== noteId);
    localStorage.setItem('decker_notes', JSON.stringify(updated));
  }
}
