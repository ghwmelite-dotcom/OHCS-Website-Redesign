// Single source of truth for the 21-state ApplicationStatus enum:
// the human label (used in badges, headers, filters) and the badge
// color class (Tailwind). Use everywhere a status renders.

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  vetting_passed: 'Vetting Passed',
  vetting_failed: 'Vetting Failed',
  requires_action: 'Awaiting Resubmit',
  appeal_under_review: 'Appeal Under Review',
  appeal_overturned: 'Appeal Overturned',
  appeal_upheld: 'Appeal Upheld',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  exam_scheduled: 'Exam Scheduled',
  exam_completed: 'Exam Completed',
  exam_passed: 'Exam Passed',
  exam_failed: 'Exam Failed',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  shortlisted: 'Shortlisted',
  waitlisted: 'Waitlisted',
  appointed: 'Appointed',
  rejected: 'Rejected',
};

// Tailwind classes for badges. All combinations meet AA contrast
// (4.5:1 on the matching bg). Categories chosen so neighbours in
// the lifecycle don't share a colour and reviewers can scan.
export const APPLICATION_STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  under_review: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  vetting_passed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  vetting_failed: 'bg-rose-100 text-rose-800 border-rose-200',
  requires_action: 'bg-amber-100 text-amber-900 border-amber-200',
  appeal_under_review: 'bg-violet-100 text-violet-800 border-violet-200',
  appeal_overturned: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  appeal_upheld: 'bg-rose-100 text-rose-800 border-rose-200',
  awaiting_payment: 'bg-amber-100 text-amber-900 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  exam_scheduled: 'bg-sky-100 text-sky-800 border-sky-200',
  exam_completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  exam_passed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  exam_failed: 'bg-rose-100 text-rose-800 border-rose-200',
  interview_scheduled: 'bg-sky-100 text-sky-800 border-sky-200',
  interview_completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shortlisted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  waitlisted: 'bg-amber-100 text-amber-900 border-amber-200',
  appointed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

const FALLBACK_LABEL = (s: string): string =>
  s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function getStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status] ?? FALLBACK_LABEL(status);
}

export function getStatusBadgeClasses(status: string): string {
  return (
    APPLICATION_STATUS_BADGE_CLASSES[status] ??
    'bg-slate-100 text-slate-700 border-slate-200'
  );
}
