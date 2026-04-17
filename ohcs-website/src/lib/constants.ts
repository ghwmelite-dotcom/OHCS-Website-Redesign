import type {
  NavItem,
  Directorate,
  Department,
  TrainingInstitution,
  SubmissionStatus,
} from '@/types';

// ─── Site Metadata ────────────────────────────────────────────────────────────

export const SITE_NAME = 'Office of the Head of Civil Service';
export const SITE_SHORT_NAME = 'OHCS';
export const SITE_URL = 'https://ohcs.gov.gh';
export const SITE_DESCRIPTION =
  'The Office of the Head of Civil Service leads the development, management, and reform of Ghana\'s Civil Service to deliver efficient and equitable public services for all citizens.';

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Civil Service', href: '/about/civil-service' },
      { label: 'Leadership', href: '/about/leadership' },
      { label: 'Structure', href: '/about/structure' },
      { label: 'Partners', href: '/about/partners' },
    ],
  },
  { label: 'Directorates', href: '/directorates' },
  { label: 'Departments', href: '/departments' },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Recruitment', href: '/services/recruitment' },
      { label: 'Right to Information (RTI)', href: '/services/rti' },
      { label: 'Complaints', href: '/services/complaints' },
      { label: 'Feedback', href: '/services/feedback' },
    ],
  },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Publications', href: '/publications' },
  { label: 'Contact', href: '/contact' },
];

// ─── Directorates ─────────────────────────────────────────────────────────────

export const DIRECTORATES: Directorate[] = [
  {
    slug: 'career-management',
    name: 'Career Management Directorate',
    shortName: 'CMD',
    description:
      'Responsible for the effective management of civil servants\' careers, including recruitment, promotion, transfers, and succession planning across the Civil Service.',
    icon: 'Briefcase',
  },
  {
    slug: 'finance-administration',
    name: 'Finance and Administration Directorate',
    shortName: 'FAD',
    description:
      'Oversees the financial management, budgeting, procurement, and administrative operations that sustain the smooth functioning of the Office of the Head of Civil Service.',
    icon: 'Wallet',
  },
  {
    slug: 'reforms',
    name: 'Reforms Directorate',
    shortName: 'RD',
    description:
      'Drives the design and implementation of Civil Service reforms to improve public sector performance, accountability, and service delivery outcomes.',
    icon: 'RefreshCw',
  },
  {
    slug: 'human-resource-management',
    name: 'Human Resource Management Directorate',
    shortName: 'HRMD',
    description:
      'Develops and coordinates human resource policies, workforce planning, performance management frameworks, and staff welfare programmes across the Civil Service.',
    icon: 'Users',
  },
  {
    slug: 'research-statistics',
    name: 'Research, Statistics, and Information Directorate',
    shortName: 'RSID',
    description:
      'Collects, analyses, and disseminates data on Civil Service workforce trends to support evidence-based policy decisions and strategic planning.',
    icon: 'BarChart3',
  },
  {
    slug: 'policy-planning',
    name: 'Policy, Planning, Monitoring and Evaluation Directorate',
    shortName: 'PPMED',
    description:
      'Coordinates the formulation of Civil Service policies, strategic plans, and monitoring frameworks to ensure alignment with national development goals.',
    icon: 'ClipboardCheck',
  },
  {
    slug: 'legal',
    name: 'Legal Directorate',
    shortName: 'LD',
    description:
      'Provides legal advisory services, ensures regulatory compliance, and manages litigation and contractual matters on behalf of the Civil Service.',
    icon: 'Scale',
  },
  {
    slug: 'ict',
    name: 'ICT Directorate',
    shortName: 'ICTD',
    description:
      'Leads the digitalisation agenda of the Civil Service by deploying and maintaining information and communication technology systems that enhance operational efficiency.',
    icon: 'Monitor',
  },
];

// ─── Departments ──────────────────────────────────────────────────────────────

export const DEPARTMENTS: Department[] = [
  {
    slug: 'internal-audit',
    name: 'Internal Audit Department',
    shortName: 'IAD',
    description:
      'Provides independent and objective assurance on governance, risk management, and internal control systems within the Civil Service to promote accountability.',
  },
  {
    slug: 'management-services',
    name: 'Management Services Department',
    shortName: 'MSD',
    description:
      'Conducts organisational reviews, job evaluations, workload analysis, and management consulting services to improve public sector efficiency and effectiveness.',
  },
  {
    slug: 'praad',
    name: 'Public Records and Archives Administration Department',
    shortName: 'PRAAD',
    description:
      'Manages the creation, storage, retrieval, and preservation of public records and archival materials to safeguard Ghana\'s institutional memory.',
    logoUrl: '/images/departments/praad-logo.png',
  },
  {
    slug: 'pscmd',
    name: 'Public Services Commission Management Department',
    shortName: 'PSCMD',
    description:
      'Coordinates the implementation of Public Services Commission directives and ensures compliance with staffing standards across public service institutions.',
    logoUrl: '/images/departments/pscmd-logo.png',
  },
];

// ─── Training Institutions ────────────────────────────────────────────────────

export const TRAINING_INSTITUTIONS: TrainingInstitution[] = [
  {
    slug: 'cstc',
    name: 'Civil Service Training Centre',
    location: 'Accra',
    focusArea:
      'Core public administration competencies, leadership development, and professional skills training for civil servants at all grades.',
    logoUrl: '/images/institutions/cstc-logo.png',
  },
  {
    slug: 'gimpa-collaboration',
    name: 'GIMPA Collaboration Programme',
    location: 'Accra',
    focusArea:
      'Executive education, postgraduate programmes, and strategic management training delivered in partnership with the Ghana Institute of Management and Public Administration.',
    logoUrl: '/images/institutions/gimpa-logo.png',
  },
  {
    slug: 'regional-training',
    name: 'Regional Training Institute',
    location: 'Kumasi',
    focusArea:
      'Decentralised capacity-building programmes serving civil servants and public sector employees in the Ashanti and adjacent regions.',
  },
];

// ─── Submission Status Labels & Colours ───────────────────────────────────────

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  received: 'Received',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};
