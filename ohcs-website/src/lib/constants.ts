import type {
  NavItem,
  Directorate,
  Department,
  Unit,
  TrainingInstitution,
  SubmissionStatus,
} from '@/types';

// ─── Site Metadata ────────────────────────────────────────────────────────────

export const SITE_NAME = 'Office of the Head of the Civil Service';
export const SITE_SHORT_NAME = 'OHCS';
export const SITE_URL = 'https://ohcs.gov.gh';
export const SITE_DESCRIPTION =
  'The Office of the Head of the Civil Service leads the development, management, and reform of Ghana\'s Civil Service to deliver efficient and equitable public services for all citizens.';

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'The Civil Service', href: '/about/civil-service', icon: 'Building2', description: 'History, mandate, and mission of the Ghana Civil Service' },
      { label: 'Our Leadership', href: '/about/leadership', icon: 'Users', description: 'Head of Service, Chief Director, and senior leadership' },
      { label: 'Organisational Structure', href: '/about/structure', icon: 'GitBranch', description: 'How the Civil Service is organised' },
      { label: 'Our Partners', href: '/about/partners', icon: 'Handshake', description: 'Collaborating organisations and development partners' },
    ],
  },
  {
    label: 'Structure',
    href: '/directorates',
    children: [
      { label: 'Directorates & Units', href: '/directorates', icon: 'LayoutGrid', description: 'Five line directorates and six support units' },
      { label: 'Departments', href: '/departments', icon: 'Building2', description: 'Key departments supporting civil service operations' },
      { label: 'Training Institutions', href: '/training', icon: 'GraduationCap', description: 'Civil Service Training Centre, GIMPA, and regional institutes' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Recruitment', href: '/services/recruitment', icon: 'UserPlus', description: 'Apply for civil service positions across Ghana' },
      { label: 'Right to Information', href: '/services/rti', icon: 'FileText', description: 'Submit RTI requests for public records' },
      { label: 'Complaints & Feedback', href: '/services/complaints', icon: 'MessageSquare', description: 'Report issues or share your feedback' },
      { label: 'Track Submission', href: '/track', icon: 'Search', description: 'Check the status of your submission' },
    ],
  },
  {
    label: 'Resources',
    href: '/news',
    children: [
      { label: 'News', href: '/news', icon: 'Newspaper', description: 'Latest announcements and updates from OHCS' },
      { label: 'Events', href: '/events', icon: 'Calendar', description: 'Upcoming conferences, workshops, and ceremonies' },
      { label: 'Publications', href: '/publications', icon: 'BookOpen', description: 'Reports, policies, circulars, and forms' },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

// ─── Directorates ─────────────────────────────────────────────────────────────

export const DIRECTORATES: Directorate[] = [
  {
    slug: 'research-statistics',
    name: 'Research, Statistics & Information Management Directorate',
    shortName: 'RSIMD',
    description:
      'Collects, analyses, and disseminates data on Civil Service workforce trends to support evidence-based policy decisions, strategic planning, and information management.',
    icon: 'BarChart3',
  },
  {
    slug: 'finance-administration',
    name: 'Finance & Administration Directorate',
    shortName: 'F&A',
    description:
      'Oversees the financial management, budgeting, procurement, and administrative operations that sustain the smooth functioning of the Office of the Head of the Civil Service.',
    icon: 'Wallet',
  },
  {
    slug: 'planning-budgeting',
    name: 'Planning, Budgeting, Monitoring & Evaluation Directorate',
    shortName: 'PBMED',
    description:
      'Coordinates the formulation of Civil Service policies, strategic plans, budgeting processes, and monitoring frameworks to ensure alignment with national development goals.',
    icon: 'ClipboardCheck',
  },
  {
    slug: 'career-management',
    name: 'Career Management Directorate',
    shortName: 'CMD',
    description:
      'Responsible for the effective management of civil servants\' careers, including promotions, transfers, postings, and succession planning across the Civil Service.',
    icon: 'Briefcase',
  },
  {
    slug: 'recruitment-training',
    name: 'Recruitment, Training & Development Directorate',
    shortName: 'RTDD',
    description:
      'Manages the recruitment of qualified personnel into the Civil Service and coordinates training and professional development programmes to build workforce capacity.',
    icon: 'GraduationCap',
  },
];

// ─── Units ───────────────────────────────────────────────────────────────────

export const UNITS: Unit[] = [
  {
    slug: 'reform-coordinating',
    name: 'Reform Coordinating Unit',
    shortName: 'RCU',
    description:
      'Drives the design and implementation of Civil Service reforms to improve public sector performance, accountability, and service delivery outcomes.',
  },
  {
    slug: 'internal-audit',
    name: 'Internal Audit Unit',
    shortName: 'IAU',
    description:
      'Provides independent and objective assurance on governance, risk management, and internal control systems within the Civil Service to promote accountability.',
  },
  {
    slug: 'civil-service-council',
    name: 'Civil Service Council',
    shortName: 'CSC',
    description:
      'Advises the President on matters relating to the Civil Service and oversees the administration, discipline, and welfare of civil servants across Ghana.',
  },
  {
    slug: 'estate',
    name: 'Estate Unit',
    shortName: 'Estate',
    description:
      'Manages and maintains the physical infrastructure, facilities, and property assets of the Office of the Head of the Civil Service.',
  },
  {
    slug: 'accounts',
    name: 'Accounts Unit',
    shortName: 'Accounts',
    description:
      'Handles financial accounting, payments processing, payroll management, and financial reporting for the Office.',
  },
  {
    slug: 'stores',
    name: 'Stores Unit',
    shortName: 'Stores',
    description:
      'Manages procurement, storage, and distribution of supplies, materials, and equipment for the Office.',
  },
];

// ─── Departments (legacy — kept for backward compatibility) ──────────────────

export const DEPARTMENTS: Department[] = [];

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
