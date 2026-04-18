import { z } from 'zod';

// ── Submissions ──

export const createSubmissionSchema = z.object({
  type: z.enum(['recruitment', 'rti', 'complaint', 'feedback']),
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().min(10).max(10000),
  // Recruitment-specific fields
  position: z.string().max(200).optional(),
  qualifications: z.string().max(5000).optional(),
  experience: z.string().max(5000).optional(),
});

export const trackSubmissionSchema = z.object({
  referenceNumber: z
    .string()
    .regex(/^OHCS-[A-Z]{3}-\d{8}-[A-Z0-9]{4}$/, 'Invalid reference number format'),
  contact: z.string().min(1, 'Email or phone is required'),
});

// ── News ──

export const createNewsSchema = z.object({
  title: z.string().min(3).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  isPublished: z.boolean().default(false),
});

// ── Events ──

export const createEventSchema = z.object({
  title: z.string().min(3).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isPublished: z.boolean().default(false),
});

// ── Publications ──

export const createPublicationSchema = z.object({
  title: z.string().min(3).max(500),
  category: z.enum(['report', 'policy', 'form', 'circular', 'other']),
  description: z.string().max(2000).optional(),
  fileUrl: z.string().url(),
  fileType: z.string().default('pdf'),
  fileSizeBytes: z.number().int().positive().optional(),
  publishedAt: z.string().datetime().optional(),
  isPublished: z.boolean().default(false),
});

// ── Leadership ──

export const createLeadershipSchema = z.object({
  name: z.string().min(2).max(200),
  title: z.string().min(2).max(200),
  bio: z.string().max(5000).optional(),
  photoUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
});

// ── Admin ──

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(['received', 'under_review', 'in_progress', 'resolved', 'closed']),
  note: z.string().max(2000).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ── Pagination ──

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
