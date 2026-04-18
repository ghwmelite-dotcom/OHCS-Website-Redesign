/** Row types matching the D1 database schema. */

export interface NewsRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  published_at: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface PublicationRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  is_published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionRow {
  id: string;
  reference_number: string;
  type: string;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  attachments: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryRow {
  id: string;
  submission_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface LeadershipRow {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  photo_url: string | null;
  display_order: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryRow {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  category: string | null;
  created_at: string;
}
