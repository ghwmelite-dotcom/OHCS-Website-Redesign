import { z } from 'zod';

// ─── Reusable field primitives ────────────────────────────────────────────────

const nameField = z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or fewer');

const optionalEmailField = z
  .string()
  .optional()
  .refine(
    (val) => !val || val === '' || z.email().safeParse(val).success,
    { message: 'Must be a valid email address' },
  );

const requiredEmailField = z.email('A valid email address is required');

const optionalPhoneField = z.string().max(20, 'Phone must be 20 characters or fewer').optional();

const requiredPhoneField = z
  .string()
  .min(1, 'Phone number is required')
  .max(20, 'Phone must be 20 characters or fewer');

const optionalSubjectField = z.string().max(500, 'Subject must be 500 characters or fewer').optional();

const requiredSubjectField = z.string().min(1, 'Subject is required').max(500, 'Subject must be 500 characters or fewer');

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const complaintFormSchema = z.object({
  name: nameField,
  email: optionalEmailField,
  phone: optionalPhoneField,
  subject: optionalSubjectField,
  body: z
    .string()
    .min(10, 'Complaint must be at least 10 characters')
    .max(5000, 'Complaint must be 5 000 characters or fewer'),
});

export const feedbackFormSchema = z.object({
  name: nameField,
  email: optionalEmailField,
  phone: optionalPhoneField,
  subject: optionalSubjectField,
  body: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(5000, 'Feedback must be 5 000 characters or fewer'),
});

export const rtiFormSchema = z.object({
  name: nameField,
  email: requiredEmailField,
  phone: optionalPhoneField,
  subject: requiredSubjectField,
  body: z
    .string()
    .min(20, 'Request details must be at least 20 characters')
    .max(5000, 'Request details must be 5 000 characters or fewer'),
});

export const recruitmentFormSchema = z.object({
  name: nameField,
  email: requiredEmailField,
  phone: requiredPhoneField,
  position: z.string().min(1, 'Position is required').max(200, 'Position must be 200 characters or fewer'),
  qualifications: z
    .string()
    .min(1, 'Qualifications are required')
    .max(2000, 'Qualifications must be 2 000 characters or fewer'),
  experience: z
    .string()
    .min(1, 'Experience is required')
    .max(2000, 'Experience must be 2 000 characters or fewer'),
  coverLetter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(5000, 'Cover letter must be 5 000 characters or fewer'),
});

// Accept either the legacy submission format (complaints/RTI) OR the
// recruitment application format (OHCS-YYYY-NNNNN). The /track page
// branches at runtime based on which one matched.
const LEGACY_REF = /^OHCS-[A-Z]{3}-\d{8}-[A-Z0-9]{4}$/;
const RECRUITMENT_REF = /^OHCS-\d{4}-\d+$/;

export const trackFormSchema = z.object({
  referenceNumber: z
    .string()
    .min(1, 'Reference number is required')
    .refine(
      (v) => LEGACY_REF.test(v) || RECRUITMENT_REF.test(v),
      'Enter a valid reference number (OHCS-XXX-YYYYMMDD-XXXX or OHCS-YYYY-NNNNN)',
    ),
  contact: z.string().min(1, 'Email address or phone number is required'),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ComplaintFormData = z.infer<typeof complaintFormSchema>;
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
export type RtiFormData = z.infer<typeof rtiFormSchema>;
export type RecruitmentFormData = z.infer<typeof recruitmentFormSchema>;
export type TrackFormData = z.infer<typeof trackFormSchema>;
