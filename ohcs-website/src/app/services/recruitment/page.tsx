'use client';

import { PageHero } from '@/components/layout/page-hero';
import { SubmissionForm } from '@/components/forms/submission-form';
import { recruitmentFormSchema, type RecruitmentFormData } from '@/lib/validations';
import type { Path } from 'react-hook-form';

const fields: Array<{
  name: Path<RecruitmentFormData>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = [
  { name: 'name', label: 'Full Name', placeholder: 'Enter your full name', required: true },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    required: true,
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+233 XX XXX XXXX',
    required: true,
  },
  {
    name: 'position',
    label: 'Position Applied For',
    placeholder: 'Enter the position title',
    required: true,
  },
  {
    name: 'qualifications',
    label: 'Qualifications',
    type: 'textarea',
    placeholder: 'List your academic qualifications and certifications...',
    required: true,
    rows: 4,
  },
  {
    name: 'experience',
    label: 'Work Experience',
    type: 'textarea',
    placeholder: 'Describe your relevant work experience...',
    required: true,
    rows: 4,
  },
  {
    name: 'coverLetter',
    label: 'Cover Letter',
    type: 'textarea',
    placeholder: 'Write your cover letter here...',
    required: true,
    rows: 8,
  },
];

export default function RecruitmentPage() {
  return (
    <>
      <PageHero
        title="Apply for a Position"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Recruitment' },
        ]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-lg text-text-muted mb-8">
            Submit your application for civil service positions across Ghana. Please
            fill in all required fields and provide detailed information about your
            qualifications and experience.
          </p>

          <SubmissionForm<RecruitmentFormData>
            schema={recruitmentFormSchema}
            fields={fields}
            submissionType="recruitment"
            submitLabel="Submit Application"
          />
        </div>
      </div>
    </>
  );
}
