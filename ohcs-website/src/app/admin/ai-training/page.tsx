'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bot, BookOpen, FileText, MessageSquare, Settings,
  Plus, Pencil, Trash2, Search, CheckCircle2,
  Clock, AlertCircle, Star, ChevronDown, X,
  Upload, Eye,
} from 'lucide-react';

/* ── Tab definitions ── */
const TABS = [
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ── Knowledge entry type ── */
interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  updatedAt: string;
}

/* ── Document type ── */
interface DocumentEntry {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  status: 'processing' | 'ready' | 'error';
  uploadedAt: string;
  category: string;
}

/* ── Conversation type ── */
interface ConversationEntry {
  id: string;
  userQuestion: string;
  botAnswer: string;
  rating: number | null;
  timestamp: string;
  resolved: boolean;
}

/* ── Initial data ── */
const INITIAL_KNOWLEDGE: KnowledgeEntry[] = [
  { id: 'k1', question: 'What does OHCS do?', answer: 'The Office of the Head of the Civil Service (OHCS) is the apex administrative body responsible for managing, developing, and reforming Ghana\'s Civil Service. It oversees recruitment, training, career management, and performance across all civil servants.', category: 'General', updatedAt: '2026-04-15' },
  { id: 'k2', question: 'How do I apply for the Civil Service?', answer: 'OHCS announces recruitment exercises through ohcs.gov.gh and official social media. Applications are submitted online during the open window. Shortlisted candidates sit the Civil Service Graduate Entrance Examination. OHCS never charges fees for applications.', category: 'Recruitment', updatedAt: '2026-04-14' },
  { id: 'k3', question: 'What is the Right to Information Act?', answer: 'Under the Right to Information Act, 2019 (Act 989), every person can request information held by public institutions without giving a reason. Institutions must respond within 14 working days. Appeals can be made to the RTI Commission within 21 days of denial.', category: 'RTI', updatedAt: '2026-04-13' },
  { id: 'k4', question: 'Who is the Head of the Civil Service?', answer: 'Dr. Evans Aggrey-Darkoh, Ph.D. is the current Head of the Civil Service, leading the transformation and modernisation of Ghana\'s civil service. The Chief Director is Mr. Sylvanus Kofi Adzornu.', category: 'Leadership', updatedAt: '2026-04-12' },
  { id: 'k5', question: 'How do I file a complaint?', answer: 'Visit the Complaints & Feedback page on ohcs.gov.gh. You will receive a reference number immediately. Complaints are routed to the appropriate directorate and we aim to resolve them within 21 working days.', category: 'Services', updatedAt: '2026-04-11' },
  { id: 'k6', question: 'What are the OHCS office hours?', answer: 'Monday to Friday, 8:00 AM to 5:00 PM. Closed on weekends and public holidays. Located at P.O. Box M.49, Accra, Ghana. Phone: +233 (0)30 266 5421. Email: info@ohcs.gov.gh.', category: 'Contact', updatedAt: '2026-04-10' },
  { id: 'k7', question: 'What is the structure of OHCS?', answer: 'OHCS has 5 Line Directorates (RSIMD, F&A, PBMED, CMD, RTDD), 6 Support Units (RCU, IAU, CSC, Estate, Accounts, Stores), and 3 Training Institutions across the country.', category: 'General', updatedAt: '2026-04-09' },
  { id: 'k8', question: 'How do I track my submission?', answer: 'Visit the Track Submission page, enter your reference number (format: OHCS-XXX-XXXXXXXX-XXXX) and the email or phone used when submitting. You can view current status and timeline.', category: 'Services', updatedAt: '2026-04-08' },
  { id: 'k9', question: 'What publications are available?', answer: 'OHCS offers Performance Agreement Templates, Civil Service Code of Conduct, Annual Performance Reports, Training Report Templates, RTI Manuals, and Awards Nomination Forms — all free to download from the Publications page.', category: 'Publications', updatedAt: '2026-04-07' },
  { id: 'k10', question: 'What training institutions does OHCS operate?', answer: 'OHCS operates three training institutions: the Civil Service Training Centre (CSTC) in Accra, the Management Development and Productivity Institute (MDPI), and regional training centres that build capacity across 20,000+ civil servants.', category: 'Training', updatedAt: '2026-04-06' },
];

const INITIAL_DOCUMENTS: DocumentEntry[] = [
  { id: 'd1', title: 'Civil Service Act, 1993 (PNDCL 327)', fileName: 'civil-service-act-1993.pdf', fileSize: '2.4 MB', status: 'ready', uploadedAt: '2026-04-10', category: 'Legislation' },
  { id: 'd2', title: 'Right to Information Act, 2019 (Act 989)', fileName: 'rti-act-2019.pdf', fileSize: '1.8 MB', status: 'ready', uploadedAt: '2026-04-09', category: 'Legislation' },
  { id: 'd3', title: 'OHCS Annual Report 2025', fileName: 'ohcs-annual-report-2025.pdf', fileSize: '5.2 MB', status: 'ready', uploadedAt: '2026-04-08', category: 'Reports' },
  { id: 'd4', title: 'Civil Service Code of Conduct', fileName: 'code-of-conduct-2024.pdf', fileSize: '890 KB', status: 'processing', uploadedAt: '2026-04-16', category: 'Policy' },
  { id: 'd5', title: 'Performance Management Framework', fileName: 'pm-framework-2025.pdf', fileSize: '3.1 MB', status: 'ready', uploadedAt: '2026-04-05', category: 'Policy' },
];

const INITIAL_CONVERSATIONS: ConversationEntry[] = [
  { id: 'c1', userQuestion: 'How do I join the civil service?', botAnswer: 'Thank you for your interest! OHCS manages recruitment through the Graduate Entrance Examination. Applications are submitted online during announced windows...', rating: 5, timestamp: '2026-04-17T09:15:00', resolved: true },
  { id: 'c2', userQuestion: 'I want to submit an RTI request', botAnswer: 'Under the Right to Information Act, 2019 (Act 989), you can request any information held by public institutions. Visit our RTI page to get started...', rating: 4, timestamp: '2026-04-17T08:30:00', resolved: true },
  { id: 'c3', userQuestion: 'When will the next recruitment exercise be?', botAnswer: 'Recruitment exercises are announced through official channels at ohcs.gov.gh. I recommend subscribing to notifications on our Recruitment page...', rating: 3, timestamp: '2026-04-16T16:45:00', resolved: false },
  { id: 'c4', userQuestion: 'Can I visit the office on Saturday?', botAnswer: 'OHCS is open Monday to Friday, 8:00 AM to 5:00 PM. We are closed on weekends and public holidays. However, I am available 24/7 right here!', rating: 5, timestamp: '2026-04-16T14:20:00', resolved: true },
  { id: 'c5', userQuestion: 'Who is the current head?', botAnswer: 'Dr. Evans Aggrey-Darkoh, Ph.D. is the current Head of the Civil Service. The Chief Director is Mr. Sylvanus Kofi Adzornu...', rating: 5, timestamp: '2026-04-16T11:00:00', resolved: true },
  { id: 'c6', userQuestion: 'How do I check my application status?', botAnswer: 'Visit our Track Submission page and enter your reference number (format: OHCS-XXX-XXXXXXXX-XXXX) along with the email or phone you used...', rating: 4, timestamp: '2026-04-15T15:30:00', resolved: true },
  { id: 'c7', userQuestion: 'What documents can I download?', botAnswer: 'We offer Performance Agreement Templates, Civil Service Code of Conduct, Annual Performance Reports, and more — all free on our Publications page...', rating: null, timestamp: '2026-04-15T10:15:00', resolved: true },
  { id: 'c8', userQuestion: 'I paid someone for a recruitment form, is that legitimate?', botAnswer: 'OHCS never charges fees for applications. No individual is authorised to collect payments on our behalf. If you have been scammed, please report it...', rating: 5, timestamp: '2026-04-14T13:45:00', resolved: true },
];

/* ── Main Page ── */
export default function AiTrainingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('knowledge');

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-dark">AI Training Hub</h1>
            <p className="text-sm text-text-muted">Manage the knowledge base and behaviour of the Ask Ghana Civil Service assistant</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-1.5 mb-8 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-primary-dark hover:bg-primary/5',
                )}
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'knowledge' && <KnowledgeBaseTab />}
      {activeTab === 'documents' && <DocumentsTab />}
      {activeTab === 'conversations' && <ConversationsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}

/* ══════════════════════════════════════════
   Knowledge Base Tab
   ══════════════════════════════════════════ */
function KnowledgeBaseTab() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(INITIAL_KNOWLEDGE);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'General' });

  const filtered = entries.filter(
    (e) =>
      e.question.toLowerCase().includes(search.toLowerCase()) ||
      e.answer.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;
    const newEntry: KnowledgeEntry = {
      id: `k-${Date.now()}`,
      question: formData.question,
      answer: formData.answer,
      category: formData.category,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setFormData({ question: '', answer: '', category: 'General' });
    setShowForm(false);
  };

  const handleEdit = () => {
    if (!editingEntry) return;
    setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? editingEntry : e)));
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const categories = ['General', 'Recruitment', 'RTI', 'Leadership', 'Services', 'Contact', 'Publications', 'Training'];

  return (
    <div>
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge base..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingEntry(null); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Entry
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editingEntry) && (
        <div className="bg-white rounded-2xl border-2 border-primary/20 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary-dark">{editingEntry ? 'Edit Entry' : 'New Knowledge Entry'}</h3>
            <button onClick={() => { setShowForm(false); setEditingEntry(null); }} className="text-text-muted hover:text-primary-dark"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Question</label>
              <input
                type="text"
                value={editingEntry ? editingEntry.question : formData.question}
                onChange={(e) => editingEntry ? setEditingEntry({ ...editingEntry, question: e.target.value }) : setFormData({ ...formData, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="What question should this answer?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Answer</label>
              <textarea
                value={editingEntry ? editingEntry.answer : formData.answer}
                onChange={(e) => editingEntry ? setEditingEntry({ ...editingEntry, answer: e.target.value }) : setFormData({ ...formData, answer: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none"
                placeholder="The verified answer..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
              <select
                value={editingEntry ? editingEntry.category : formData.category}
                onChange={(e) => editingEntry ? setEditingEntry({ ...editingEntry, category: e.target.value }) : setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 bg-white"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setEditingEntry(null); }} className="px-5 py-2.5 rounded-xl border-2 border-border/40 text-sm font-medium text-text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={editingEntry ? handleEdit : handleCreate}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors"
              >
                {editingEntry ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-white rounded-2xl border-2 border-border/40 p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{entry.category}</span>
                  <span className="text-[10px] text-text-muted/50">{entry.updatedAt}</span>
                </div>
                <h4 className="font-semibold text-primary-dark text-sm mb-1">{entry.question}</h4>
                <p className="text-sm text-text-muted line-clamp-2">{entry.answer}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => { setEditingEntry(entry); setShowForm(false); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted/50 hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted/50 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted/50 text-sm">No entries found matching your search.</div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Documents Tab
   ══════════════════════════════════════════ */
function DocumentsTab() {
  const [documents] = useState<DocumentEntry[]>(INITIAL_DOCUMENTS);

  const statusConfig = {
    ready: { label: 'Ready', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
    processing: { label: 'Processing', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    error: { label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">Documents uploaded to feed the assistant&apos;s knowledge base.</p>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
          <Upload className="h-4 w-4" /> Upload Document
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border/30">
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted/50">Document</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted/50">Category</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted/50">Size</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted/50">Status</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted/50">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const sc = statusConfig[doc.status];
              return (
                <tr key={doc.id} className="border-b border-border/20 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-dark">{doc.title}</p>
                        <p className="text-[11px] text-text-muted/50">{doc.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-text-muted">{doc.category}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-text-muted">{doc.fileSize}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', sc.color)}>
                      <sc.icon className="h-3 w-3" />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-text-muted">{doc.uploadedAt}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Conversations Tab
   ══════════════════════════════════════════ */
function ConversationsTab() {
  const [conversations] = useState<ConversationEntry[]>(INITIAL_CONVERSATIONS);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">Recent public conversations for review and quality assurance.</p>
        <div className="flex items-center gap-2 text-xs text-text-muted/50">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span>{conversations.filter((c) => c.resolved).length}/{conversations.length} resolved</span>
        </div>
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => (
          <div key={conv.id} className="bg-white rounded-2xl border-2 border-border/40 p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {conv.resolved ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
                )}
                <span className="text-[10px] text-text-muted/50">
                  {new Date(conv.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}
                  {new Date(conv.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {conv.rating !== null && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn('h-3 w-3', i < conv.rating! ? 'fill-accent text-accent' : 'text-gray-200')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* User question */}
            <div className="flex gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-primary">U</span>
              </div>
              <p className="text-sm font-medium text-primary-dark">{conv.userQuestion}</p>
            </div>

            {/* Bot answer */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-accent" />
              </div>
              <p className="text-sm text-text-muted line-clamp-2">{conv.botAnswer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Settings Tab
   ══════════════════════════════════════════ */
function SettingsTab() {
  const [settings, setSettings] = useState({
    botName: 'Ask Ghana Civil Service',
    greetingStyle: 'time-based',
    responseLength: 'detailed',
    personality: 'warm',
    signOff: 'Loyalty • Excellence • Service',
    enableEmoji: true,
    enableFollowUp: true,
  });

  return (
    <div>
      <p className="text-sm text-text-muted mb-6">Configure the assistant&apos;s personality and behaviour settings.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bot Name */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <label className="block text-sm font-semibold text-primary-dark mb-2">Bot Name</label>
          <input
            type="text"
            value={settings.botName}
            onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <p className="text-[11px] text-text-muted/50 mt-2">The name displayed to users in the chat interface.</p>
        </div>

        {/* Greeting Style */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <label className="block text-sm font-semibold text-primary-dark mb-2">Greeting Style</label>
          <select
            value={settings.greetingStyle}
            onChange={(e) => setSettings({ ...settings, greetingStyle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 bg-white"
          >
            <option value="time-based">Time-based (Good morning/afternoon/evening)</option>
            <option value="formal">Formal (Welcome to OHCS)</option>
            <option value="casual">Casual (Hey there!)</option>
            <option value="ghanaian">Ghanaian (Akwaaba!)</option>
          </select>
          <p className="text-[11px] text-text-muted/50 mt-2">How the bot greets users when they first open the chat.</p>
        </div>

        {/* Response Length */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <label className="block text-sm font-semibold text-primary-dark mb-2">Response Length</label>
          <select
            value={settings.responseLength}
            onChange={(e) => setSettings({ ...settings, responseLength: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 bg-white"
          >
            <option value="concise">Concise (short, direct answers)</option>
            <option value="detailed">Detailed (comprehensive with context)</option>
            <option value="verbose">Verbose (in-depth explanations)</option>
          </select>
          <p className="text-[11px] text-text-muted/50 mt-2">Controls how detailed the bot&apos;s responses are.</p>
        </div>

        {/* Personality */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <label className="block text-sm font-semibold text-primary-dark mb-2">Personality</label>
          <select
            value={settings.personality}
            onChange={(e) => setSettings({ ...settings, personality: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 bg-white"
          >
            <option value="warm">Warm & Friendly (Ghanaian flavour)</option>
            <option value="professional">Professional (formal tone)</option>
            <option value="neutral">Neutral (balanced)</option>
          </select>
          <p className="text-[11px] text-text-muted/50 mt-2">The overall tone and warmth of the bot&apos;s communication.</p>
        </div>

        {/* Sign Off */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <label className="block text-sm font-semibold text-primary-dark mb-2">Sign-off Message</label>
          <input
            type="text"
            value={settings.signOff}
            onChange={(e) => setSettings({ ...settings, signOff: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border/40 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <p className="text-[11px] text-text-muted/50 mt-2">The closing message when users say goodbye.</p>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-dark">Enable Emoji</p>
              <p className="text-[11px] text-text-muted/50">Allow the bot to use emoji in responses.</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableEmoji: !settings.enableEmoji })}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                settings.enableEmoji ? 'bg-primary' : 'bg-gray-200',
              )}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', settings.enableEmoji ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-dark">Enable Follow-up Questions</p>
              <p className="text-[11px] text-text-muted/50">Bot asks follow-up questions to clarify intent.</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableFollowUp: !settings.enableFollowUp })}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                settings.enableFollowUp ? 'bg-primary' : 'bg-gray-200',
              )}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', settings.enableFollowUp ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end mt-6">
        <button className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
