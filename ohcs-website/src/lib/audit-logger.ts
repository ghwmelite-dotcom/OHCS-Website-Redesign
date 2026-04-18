// ─── Audit Trail Logger ──────────────────────────────────────────────────────
// Client-side audit logging utility (localStorage for demo mode).
// Will switch to API calls when backend is connected.

const STORAGE_KEY = 'ohcs_audit_log';
const USER_KEY = 'ohcs_admin_user';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'publish'
  | 'unpublish'
  | 'activate'
  | 'deactivate'
  | 'export'
  | 'view';

export type AuditResource =
  | 'news'
  | 'event'
  | 'publication'
  | 'leadership'
  | 'submission'
  | 'recruitment_exercise'
  | 'recruitment_application'
  | 'exam_result'
  | 'communication'
  | 'merit_list'
  | 'admin_user'
  | 'session';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  resourceTitle: string;
  details: string;
  changes?: { field: string; before: string; after: string }[];
  ipAddress: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCurrentUser(): { id: string; name: string; role: string; email: string } {
  if (typeof window === 'undefined') {
    return { id: 'system', name: 'System', role: 'system', email: '' };
  }
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const user = JSON.parse(stored) as { id: string; name: string; role: string; email: string };
      return user;
    }
  } catch {
    // ignore parse errors
  }
  return { id: 'unknown', name: 'Unknown User', role: 'unknown', email: '' };
}

function readLog(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: AuditEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Core Functions ──────────────────────────────────────────────────────────

export function logAudit(entry: AuditEntry): void {
  const log = readLog();
  log.unshift(entry);
  writeLog(log);
}

export function getAuditLog(): AuditEntry[] {
  const log = readLog();
  if (log.length === 0) {
    seedAuditLog();
    return readLog();
  }
  return log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function clearAuditLog(): void {
  const user = getCurrentUser();
  if (user.role !== 'super_admin') return;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getAuditLogForResource(resource: AuditResource, resourceId: string): AuditEntry[] {
  return getAuditLog().filter(
    (entry) => entry.resource === resource && entry.resourceId === resourceId,
  );
}

// ─── Shorthand ───────────────────────────────────────────────────────────────

export function audit(
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  resourceTitle: string,
  details: string,
  changes?: { field: string; before: string; after: string }[],
): void {
  const user = getCurrentUser();
  const entry: AuditEntry = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    userEmail: user.email,
    action,
    resource,
    resourceId,
    resourceTitle,
    details,
    changes,
    ipAddress: '127.0.0.1',
  };
  logAudit(entry);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function seedAuditLog(): void {
  const now = Date.now();
  const hour = 3_600_000;
  const day = 86_400_000;

  const entries: AuditEntry[] = [
    {
      id: generateUUID(),
      timestamp: new Date(now - 1 * hour).toISOString(),
      userId: 'demo-001',
      userName: 'Kwame Mensah',
      userRole: 'super_admin',
      userEmail: 'admin@ohcs.gov.gh',
      action: 'login',
      resource: 'session',
      resourceId: 'demo-001',
      resourceTitle: 'Kwame Mensah',
      details: 'Logged in to admin portal',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 2 * hour).toISOString(),
      userId: 'demo-002',
      userName: 'Abena Osei',
      userRole: 'content_manager',
      userEmail: 'content@ohcs.gov.gh',
      action: 'publish',
      resource: 'news',
      resourceId: '1',
      resourceTitle: "Nigeria's Federal Civil Service Pays Courtesy Call",
      details: "Published news article 'Nigeria Courtesy Call'",
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 3 * hour).toISOString(),
      userId: 'demo-003',
      userName: 'Kofi Adjei',
      userRole: 'recruitment_admin',
      userEmail: 'recruitment@ohcs.gov.gh',
      action: 'status_change',
      resource: 'recruitment_application',
      resourceId: 'OHCS-REC-20260418-A7F3',
      resourceTitle: 'Kwaku Asante',
      details: 'Advanced application OHCS-REC-20260418-A7F3 to Screening',
      changes: [{ field: 'stage', before: 'Received', after: 'Screening' }],
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 5 * hour).toISOString(),
      userId: 'demo-001',
      userName: 'Kwame Mensah',
      userRole: 'super_admin',
      userEmail: 'admin@ohcs.gov.gh',
      action: 'create',
      resource: 'admin_user',
      resourceId: 'demo-004',
      resourceTitle: 'Ama Darko',
      details: 'Created admin user Ama Darko with role viewer',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 6 * hour).toISOString(),
      userId: 'demo-002',
      userName: 'Abena Osei',
      userRole: 'content_manager',
      userEmail: 'content@ohcs.gov.gh',
      action: 'create',
      resource: 'event',
      resourceId: '1',
      resourceTitle: 'Civil Service Week 2026 Opening Ceremony',
      details: 'Created event for Civil Service Week Opening Ceremony',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 8 * hour).toISOString(),
      userId: 'demo-002',
      userName: 'Abena Osei',
      userRole: 'content_manager',
      userEmail: 'content@ohcs.gov.gh',
      action: 'update',
      resource: 'publication',
      resourceId: '1',
      resourceTitle: 'Head of Department Performance Agreement 2024',
      details: 'Updated publication document metadata',
      changes: [{ field: 'category', before: 'form', after: 'report' }],
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 10 * hour).toISOString(),
      userId: 'demo-003',
      userName: 'Kofi Adjei',
      userRole: 'recruitment_admin',
      userEmail: 'recruitment@ohcs.gov.gh',
      action: 'activate',
      resource: 'recruitment_exercise',
      resourceId: 'ex-001',
      resourceTitle: '2026 Graduate Entrance Examination',
      details: 'Activated recruitment exercise for 2026 Graduate Entrance Examination',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 1 * day).toISOString(),
      userId: 'demo-001',
      userName: 'Kwame Mensah',
      userRole: 'super_admin',
      userEmail: 'admin@ohcs.gov.gh',
      action: 'update',
      resource: 'leadership',
      resourceId: '1',
      resourceTitle: 'Evans Aggrey-Darkoh',
      details: 'Updated biography for Head of Civil Service',
      changes: [{ field: 'bio', before: '(previous bio text)', after: '(updated bio text)' }],
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 1 * day - 2 * hour).toISOString(),
      userId: 'demo-003',
      userName: 'Kofi Adjei',
      userRole: 'recruitment_admin',
      userEmail: 'recruitment@ohcs.gov.gh',
      action: 'status_change',
      resource: 'submission',
      resourceId: 'SUB-2025-0118',
      resourceTitle: 'SUB-2025-0118',
      details: 'Changed submission status to Under Review',
      changes: [{ field: 'status', before: 'received', after: 'under_review' }],
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 1 * day - 5 * hour).toISOString(),
      userId: 'demo-002',
      userName: 'Abena Osei',
      userRole: 'content_manager',
      userEmail: 'content@ohcs.gov.gh',
      action: 'create',
      resource: 'news',
      resourceId: '2',
      resourceTitle: 'OHCS Launches 2026 Training Programme',
      details: 'Created news article about 2026 Training Programme launch',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 2 * day).toISOString(),
      userId: 'demo-001',
      userName: 'Kwame Mensah',
      userRole: 'super_admin',
      userEmail: 'admin@ohcs.gov.gh',
      action: 'deactivate',
      resource: 'admin_user',
      resourceId: 'u-005',
      resourceTitle: 'Yaw Boateng',
      details: 'Deactivated admin user Yaw Boateng',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 2 * day - 3 * hour).toISOString(),
      userId: 'demo-004',
      userName: 'Ama Darko',
      userRole: 'viewer',
      userEmail: 'viewer@ohcs.gov.gh',
      action: 'view',
      resource: 'submission',
      resourceId: 'SUB-2025-0117',
      resourceTitle: 'SUB-2025-0117',
      details: 'Viewed submission details for SUB-2025-0117',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 3 * day).toISOString(),
      userId: 'demo-002',
      userName: 'Abena Osei',
      userRole: 'content_manager',
      userEmail: 'content@ohcs.gov.gh',
      action: 'delete',
      resource: 'news',
      resourceId: 'old-draft-1',
      resourceTitle: 'Draft: Upcoming Policy Changes',
      details: 'Deleted draft news article',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 3 * day - 4 * hour).toISOString(),
      userId: 'demo-003',
      userName: 'Kofi Adjei',
      userRole: 'recruitment_admin',
      userEmail: 'recruitment@ohcs.gov.gh',
      action: 'export',
      resource: 'recruitment_application',
      resourceId: 'ex-001',
      resourceTitle: '2026 Graduate Entrance Examination',
      details: 'Exported applicant list for 2026 Graduate Entrance Examination',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 4 * day).toISOString(),
      userId: 'demo-001',
      userName: 'Kwame Mensah',
      userRole: 'super_admin',
      userEmail: 'admin@ohcs.gov.gh',
      action: 'update',
      resource: 'admin_user',
      resourceId: 'demo-003',
      resourceTitle: 'Kofi Adjei',
      details: 'Updated role for Kofi Adjei',
      changes: [{ field: 'role', before: 'viewer', after: 'recruitment_admin' }],
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 4 * day - 2 * hour).toISOString(),
      userId: 'demo-002',
      userName: 'Abena Osei',
      userRole: 'content_manager',
      userEmail: 'content@ohcs.gov.gh',
      action: 'unpublish',
      resource: 'news',
      resourceId: '4',
      resourceTitle: 'Civil Service Week 2026 Preparations Underway',
      details: 'Unpublished news article — moved back to draft',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 5 * day).toISOString(),
      userId: 'demo-003',
      userName: 'Kofi Adjei',
      userRole: 'recruitment_admin',
      userEmail: 'recruitment@ohcs.gov.gh',
      action: 'create',
      resource: 'recruitment_exercise',
      resourceId: 'ex-003',
      resourceTitle: '2026 Technical Specialist Drive',
      details: 'Created new recruitment exercise for technical specialist positions',
      ipAddress: '127.0.0.1',
    },
    {
      id: generateUUID(),
      timestamp: new Date(now - 5 * day - 6 * hour).toISOString(),
      userId: 'demo-001',
      userName: 'Kwame Mensah',
      userRole: 'super_admin',
      userEmail: 'admin@ohcs.gov.gh',
      action: 'login',
      resource: 'session',
      resourceId: 'demo-001',
      resourceTitle: 'Kwame Mensah',
      details: 'Logged in to admin portal',
      ipAddress: '127.0.0.1',
    },
  ];

  writeLog(entries);
}
