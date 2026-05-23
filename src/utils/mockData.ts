import { Course, Note } from '../types';

export const initialCourses: Course[] = [
  {
    id: 'course-csc',
    code: 'CSE-101',
    name: 'Introduction to Computer Science',
    color: 'indigo',
    createdAt: '2026-05-18T10:00:00Z',
  },
  {
    id: 'course-pha',
    code: 'FA-101',
    name: 'Pharmacy Lab Practice & Bio-analysis',
    color: 'emerald',
    createdAt: '2026-05-19T11:00:00Z',
  },
  {
    id: 'course-eng',
    code: 'NG-101',
    name: 'Engineering Statics & Dynamics',
    color: 'amber',
    createdAt: '2026-05-20T14:30:00Z',
  },
];

export const initialNotes: Note[] = [
  // Computer Science Notes (CSE-101)
  {
    id: 'note-csc-1',
    courseId: 'course-csc',
    title: 'Variables, Types, and Arrays',
    order: 1,
    createdAt: '2026-05-18T10:15:00Z',
    description: 'Core memory allocations and pointer offsets.',
    ocrStatus: 'completed',
    ocrText: 'Variables Types and Arrays Memory allocation sequences Pointer offsets CS101.',
    images: [
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'note-csc-2',
    courseId: 'course-csc',
    title: 'Functional Recursion and Call Stacks',
    order: 2,
    createdAt: '2026-05-18T11:00:00Z',
    description: 'Visualizing stack frames and LIFO heap operations.',
    ocrStatus: 'completed',
    ocrText: 'Call Stacks visual representation. Stack frames active memory heap tree recursions.',
    images: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'note-csc-3',
    courseId: 'course-csc',
    title: 'Big-O Notation Performance',
    order: 3,
    createdAt: '2026-05-18T12:00:00Z',
    description: 'Comparing logarithmic, linear, and exponential algorithm curves.',
    ocrStatus: 'idle',
    images: [] // Empty placeholder to verify exact fallback styles
  },
  {
    id: 'note-csc-4',
    courseId: 'course-csc',
    title: 'Graph Traversals - BFS vs DFS',
    order: 4,
    createdAt: '2026-05-18T13:00:00Z',
    description: 'Adjacency lists, queue trees, and visited node checklists.',
    ocrStatus: 'completed',
    ocrText: 'BFS Breadth First vs DFS Depth First traversal stack queue structures.',
    images: [
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800'
    ]
  },

  // Pharmacy Lab Notes (FA-101)
  {
    id: 'note-pha-1',
    courseId: 'course-pha',
    title: 'Chromatography Sample Isolation',
    order: 1,
    createdAt: '2026-05-19T11:15:00Z',
    description: 'Measuring retention factors of liquid chemical solutes.',
    ocrStatus: 'completed',
    ocrText: 'Chromatography solute compound isolation retention factors and organic laboratory solvents.',
    images: [
      'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'note-pha-2',
    courseId: 'course-pha',
    title: 'Spectroscopy Frequency Calibration',
    order: 2,
    createdAt: '2026-05-19T11:30:00Z',
    description: 'Optical filters, absorption grids, and light reflection levels.',
    ocrStatus: 'completed',
    ocrText: 'Optical laboratory spectrum absorption levels frequency diagnostics.',
    images: [
      'https://images.unsplash.com/photo-1453733190148-c44698c265a8?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'note-pha-3',
    courseId: 'course-pha',
    title: 'Acid-Base Reagent Titration',
    order: 3,
    createdAt: '2026-05-19T11:45:00Z',
    description: 'Tracking exact pH transitions step-by-step.',
    ocrStatus: 'completed',
    images: [
      'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=800'
    ]
  },

  // Engineering Notes (NG-101)
  {
    id: 'note-eng-1',
    courseId: 'course-eng',
    title: 'Truss Force Distribution Equations',
    order: 1,
    createdAt: '2026-05-20T14:45:00Z',
    description: 'Joint vectors, support nodes, and loaded structure offsets.',
    ocrStatus: 'completed',
    ocrText: 'Truss forces joint vectors compression tension loading limits mechanical nodes.',
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'note-eng-2',
    courseId: 'course-eng',
    title: 'Friction Coefficient Matrix',
    order: 2,
    createdAt: '2026-05-20T15:00:00Z',
    description: 'Static versus kinetic energy slides across inclined surfaces.',
    ocrStatus: 'completed',
    ocrText: 'Friction dynamics kinetic angles slopes gravity force matrix mechanical calculations.',
    images: [
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800'
    ]
  }
];
