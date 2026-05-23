export interface Course {
  id: string;
  code: string;
  name: string;
  color: string; // Tailwind class name or custom color
  createdAt: string;
  notesCount?: number; // Cache count for easy display
}

export interface Note {
  id: string;
  courseId: string;
  title: string;
  order: number;
  images: string[]; // SVGs or uploaded base64 data URIs
  ocrText?: string;
  ocrStatus: 'idle' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  description?: string;
}
