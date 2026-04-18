'use client';

import { useState } from 'react';
import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { cn } from '@/lib/utils';
import {
  FileText,
  Download,
  Search,
  Filter,
  BookOpen,
  Scale,
  ClipboardList,
  Newspaper,
  FolderOpen,
  ExternalLink,
  Calendar,
  FileIcon,
} from 'lucide-react';

type CategoryKey = 'all' | 'report' | 'policy' | 'form' | 'circular';

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof FileText; gradient: string; count: number }[] = [
  { key: 'all', label: 'All Documents', icon: FolderOpen, gradient: 'from-primary to-emerald-600', count: 24 },
  { key: 'report', label: 'Reports', icon: BookOpen, gradient: 'from-blue-500 to-indigo-600', count: 8 },
  { key: 'policy', label: 'Policies & Guidelines', icon: Scale, gradient: 'from-amber-500 to-yellow-600', count: 6 },
  { key: 'form', label: 'Forms & Templates', icon: ClipboardList, gradient: 'from-rose-500 to-pink-600', count: 5 },
  { key: 'circular', label: 'Circulars', icon: Newspaper, gradient: 'from-purple-500 to-violet-600', count: 5 },
];

interface SampleDoc {
  id: number;
  title: string;
  category: CategoryKey;
  description: string;
  fileType: string;
  fileSize: string;
  date: string;
}

const SAMPLE_DOCS: SampleDoc[] = [
  { id: 1, title: 'Civil Service Regulations 2024 (Consolidated)', category: 'policy', description: 'Comprehensive regulations governing the conduct and administration of the Civil Service.', fileType: 'PDF', fileSize: '2.4 MB', date: '15 Mar 2026' },
  { id: 2, title: 'Annual Performance Report 2025', category: 'report', description: 'A detailed assessment of Civil Service performance metrics across all directorates.', fileType: 'PDF', fileSize: '5.1 MB', date: '10 Mar 2026' },
  { id: 3, title: 'Leave Application Form', category: 'form', description: 'Standard form for civil servants to apply for annual, sick, or study leave.', fileType: 'DOCX', fileSize: '120 KB', date: '1 Feb 2026' },
  { id: 4, title: 'Circular: 2026 Salary Adjustment Implementation', category: 'circular', description: 'Guidelines for implementing the 2026 salary adjustment across all ministries and agencies.', fileType: 'PDF', fileSize: '340 KB', date: '28 Feb 2026' },
  { id: 5, title: 'Training & Development Policy Framework', category: 'policy', description: 'Policy framework for structured training and professional development of civil servants.', fileType: 'PDF', fileSize: '1.8 MB', date: '20 Jan 2026' },
  { id: 6, title: 'Workforce Analysis Report Q4 2025', category: 'report', description: 'Quarterly analysis of Civil Service workforce demographics, trends, and recommendations.', fileType: 'PDF', fileSize: '3.2 MB', date: '15 Jan 2026' },
  { id: 7, title: 'Performance Appraisal Template', category: 'form', description: 'Standard template for annual performance appraisal of civil servants at all grades.', fileType: 'XLSX', fileSize: '85 KB', date: '5 Jan 2026' },
  { id: 8, title: 'Circular: Updated Code of Conduct', category: 'circular', description: 'Revised code of conduct incorporating new provisions on digital ethics and social media use.', fileType: 'PDF', fileSize: '280 KB', date: '12 Dec 2025' },
  { id: 9, title: 'Ghana Civil Service Strategic Plan 2024-2028', category: 'report', description: 'Five-year strategic plan outlining the vision, mission, and key objectives for civil service reform.', fileType: 'PDF', fileSize: '4.7 MB', date: '1 Nov 2025' },
  { id: 10, title: 'Recruitment Request Form', category: 'form', description: 'Form for MDAs to request approval for new recruitment into vacant civil service positions.', fileType: 'PDF', fileSize: '95 KB', date: '20 Oct 2025' },
  { id: 11, title: 'Public Service Ethics Guidelines', category: 'policy', description: 'Comprehensive guidelines on ethical standards, conflict of interest, and whistleblower protections.', fileType: 'PDF', fileSize: '1.2 MB', date: '15 Sep 2025' },
  { id: 12, title: 'Circular: Remote Work Policy for Civil Servants', category: 'circular', description: 'Official policy on flexible and remote working arrangements for eligible civil servants.', fileType: 'PDF', fileSize: '210 KB', date: '1 Sep 2025' },
];

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
};

export default function PublicationsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = SAMPLE_DOCS
    .filter((doc) => {
      const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
      const matchesSearch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <PageHero
        title="Publications & Downloads"
        subtitle="Access official reports, policies, circulars, forms, and other documents from the Office of the Head of the Civil Service."
        breadcrumbs={[{ label: 'Publications' }]}
        accent="gold"
      >
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <FileText className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">Official documents only</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <Download className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">Free to download</span>
          </div>
          <a
            href="https://ohcselibrary.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-2 hover:bg-accent/30 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/80 font-medium">Visit the E-Library</span>
            <ExternalLink className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          </a>
        </div>
      </PageHero>

      <KenteSectionDivider />

      {/* ── Category Cards ── */}
      <section className="py-16 lg:py-20 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'group flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 text-center',
                  activeCategory === cat.key
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border/40 bg-white hover:border-primary/20 hover:shadow-sm hover:-translate-y-0.5',
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm transition-transform duration-300',
                  activeCategory === cat.key ? 'scale-110' : 'group-hover:scale-105',
                  cat.gradient,
                )}>
                  <cat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <span className={cn(
                  'text-sm font-semibold mb-1',
                  activeCategory === cat.key ? 'text-primary-dark' : 'text-text-muted',
                )}>
                  {cat.label}
                </span>
                <span className={cn(
                  'text-xs',
                  activeCategory === cat.key ? 'text-primary' : 'text-text-muted/50',
                )}>
                  {cat.count} documents
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Document List ── */}
      <section className="py-12 lg:py-16 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search bar */}
          <div className="mb-10">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search publications by title or keyword..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted hover:text-primary-dark transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-sm text-text-muted mt-3">
              Showing {filtered.length} document{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' && ` in ${CATEGORIES.find((c) => c.key === activeCategory)?.label}`}
            </p>
          </div>

          {/* Document cards */}
          <div className="space-y-4">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white rounded-2xl border-2 border-border/40 p-6 flex flex-col sm:flex-row sm:items-center gap-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                {/* File type badge */}
                <div className="flex items-center gap-4 sm:w-20 shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md', FILE_TYPE_COLORS[doc.fileType] ?? 'bg-gray-100 text-gray-700')}>
                      {doc.fileType}
                    </span>
                    <span className="text-xs text-text-muted/50">{doc.fileSize}</span>
                    <span className="text-xs text-text-muted/50">•</span>
                    <span className="text-xs text-text-muted/50 flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {doc.date}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-primary-dark mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-1 leading-relaxed">
                    {doc.description}
                  </p>
                </div>

                {/* Download button */}
                <button
                  type="button"
                  className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/5 border-2 border-primary/10 text-sm font-semibold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <FolderOpen className="h-12 w-12 text-text-muted/30 mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-semibold text-lg text-text-muted mb-2">No documents found</h3>
                <p className="text-base text-text-muted/60">
                  Try adjusting your search or category filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── E-Library CTA ── */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative bg-primary-dark rounded-2xl p-10 lg:p-14 overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: [
                  'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
                  'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
                ].join(', '),
              }}
            />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="h-8 w-8 text-primary-dark" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                Need More Resources?
              </h2>
              <p className="text-base text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
                The OHCS E-Library offers AI-powered search, career development tools, training resources, and a comprehensive document management system.
              </p>
              <a
                href="https://ohcselibrary.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary-dark font-semibold text-base rounded-xl hover:bg-accent-light hover:shadow-lg transition-all duration-200"
              >
                Explore the E-Library
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
