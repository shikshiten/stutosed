export type MediaURLType = 'hls' | 'youtube' | 'pdf' | 'external' | 'unknown';

export interface ServerOption {
  name: string;
  url: string;
  downloadUrl?: string;
  streamUrl?: string;
  type?: MediaURLType;
}

export interface LectureItem {
  id?: string;
  label: string;
  url: string;
  downloadUrl?: string;
  type: MediaURLType;
  thumb?: string;
  subject?: string;
  topic?: string;
  folderName?: string;
  category?: 'videos' | 'pdfs';
  attachmentLinks?: Record<string, string>;
  links?: Record<string, string>;
  servers?: ServerOption[];
}

export interface CourseTab {
  id: string;
  label: string;
  thumb?: string;
  subname?: string;
  items: LectureItem[];
}

export interface ParmarLecture {
  title: string;
  links: Record<string, string>;
}

export interface ParmarSubjectData {
  lectures: ParmarLecture[];
}

export interface Course {
  id: string;
  name: string;
  subname: string;
  teacher: string;
  subject: string;
  thumb: string;
  category?: 'beu' | 'government' | 'all';
  desc?: string;
  isFolderMode?: boolean;
  tabs?: CourseTab[];
  isParmar?: boolean;
  parmarData?: Record<string, ParmarSubjectData>;
  isPratham?: boolean;
  prathamBySubject?: Record<string, LectureItem[]>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface CourseMemory {
  courseId: string;
  tabId: string;
  url: string;
  timestamp?: number;
}

export type ThemeMode = 'light' | 'dark';
