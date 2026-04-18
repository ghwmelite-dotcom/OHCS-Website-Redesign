// ─── Enumerations ────────────────────────────────────────────────────────────

export type SubmissionType = 'recruitment' | 'rti' | 'complaint' | 'feedback';

export type SubmissionStatus =
  | 'received'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type PublicationCategory = 'report' | 'policy' | 'form' | 'circular' | 'other';

export type GalleryItemType = 'photo' | 'video';

// ─── Content Entities ─────────────────────────────────────────────────────────

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: PublicationCategory;
  fileUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  type: GalleryItemType;
  url: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export interface Submission {
  id: number;
  referenceNumber: string;
  type: SubmissionType;
  status: SubmissionStatus;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionStatusEntry {
  id: number;
  submissionId: number;
  status: SubmissionStatus;
  note: string | null;
  createdAt: string;
}

// ─── People & Organisations ───────────────────────────────────────────────────

export interface LeadershipProfile {
  id: number;
  name: string;
  title: string;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Directorate {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
}

export interface Department {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  logoUrl?: string;
}

export interface Unit {
  slug: string;
  name: string;
  shortName: string;
  description: string;
}

export interface TrainingInstitution {
  slug: string;
  name: string;
  location: string;
  focusArea: string;
  logoUrl?: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  children?: NavItem[];
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export type AdminRole =
  | 'super_admin'
  | 'content_manager'
  | 'recruitment_admin'
  | 'viewer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminSession {
  token: string;
  expiresAt: string;
  user: AdminUser;
}
