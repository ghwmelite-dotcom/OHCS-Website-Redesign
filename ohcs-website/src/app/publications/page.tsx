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
  { key: 'all', label: 'All Documents', icon: FolderOpen, gradient: 'from-primary to-emerald-600', count: 25 },
  { key: 'report', label: 'Reports & Plans', icon: BookOpen, gradient: 'from-blue-500 to-indigo-600', count: 5 },
  { key: 'policy', label: 'Policies & Guidelines', icon: Scale, gradient: 'from-amber-500 to-yellow-600', count: 9 },
  { key: 'form', label: 'Forms & Templates', icon: ClipboardList, gradient: 'from-rose-500 to-pink-600', count: 8 },
  { key: 'circular', label: 'Circulars & Notices', icon: Newspaper, gradient: 'from-purple-500 to-violet-600', count: 3 },
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
  // 2026 documents
  { id: 1, title: 'HoD 2026 Performance Agreement Template', category: 'form', description: 'Performance agreement template for Heads of Departments for the 2026 fiscal year.', fileType: 'DOCX', fileSize: '145 KB', date: '31 Mar 2026' },
  { id: 2, title: 'Coordinating Directors 2026 Performance Agreement', category: 'form', description: 'Performance agreement template for Coordinating Directors across all ministries.', fileType: 'DOCX', fileSize: '152 KB', date: '31 Mar 2026' },
  { id: 3, title: '2026 Directors & Analogous Grades Performance Agreement Template', category: 'form', description: 'Standard performance agreement for Directors and equivalent grades in the Civil Service.', fileType: 'DOCX', fileSize: '148 KB', date: '31 Mar 2026' },
  { id: 4, title: '2026 Chief Directors Performance Agreement Template', category: 'form', description: 'Performance agreement template for Chief Directors of ministries, departments, and agencies.', fileType: 'DOCX', fileSize: '155 KB', date: '31 Mar 2026' },
  { id: 5, title: '2025 Civil Service Awards Nomination Criteria', category: 'circular', description: 'Official criteria for nominating outstanding civil servants for the annual Civil Service Awards.', fileType: 'PDF', fileSize: '320 KB', date: '24 Feb 2026' },
  { id: 6, title: '2025 Civil Service Awards Nomination Form', category: 'form', description: 'Official nomination form for the 2025 Ghana Civil Service Awards programme.', fileType: 'PDF', fileSize: '280 KB', date: '24 Feb 2026' },
  { id: 7, title: 'CSEAP Information for OHCS Website', category: 'circular', description: 'Information about the Civil Service Employee Assistance Programme (CSEAP) for all staff.', fileType: 'DOCX', fileSize: '95 KB', date: '23 Feb 2026' },
  { id: 8, title: 'CSEAP Referral Form', category: 'form', description: 'Referral form for the Civil Service Employee Assistance Programme counselling services.', fileType: 'DOCX', fileSize: '78 KB', date: '23 Feb 2026' },
  { id: 9, title: '2025 End-Year Training Report Template', category: 'form', description: 'Template for MDAs to compile and submit end-of-year training reports.', fileType: 'DOCX', fileSize: '110 KB', date: '8 Jan 2026' },
  // 2025 documents
  { id: 10, title: '2025 OHCS RTI Manual', category: 'policy', description: 'Right to Information manual for the Office of the Head of the Civil Service.', fileType: 'DOCX', fileSize: '420 KB', date: '10 Dec 2025' },
  { id: 11, title: '2025 Annual Performance Reporting Guidelines and Templates', category: 'report', description: 'Guidelines and templates for the 2025 Civil Service annual performance reporting cycle.', fileType: 'DOCX', fileSize: '380 KB', date: '9 Dec 2025' },
  { id: 12, title: '2025 Annual Performance Reporting Excel Appendices', category: 'form', description: 'Excel appendices for data collection as part of the annual performance reporting exercise.', fileType: 'XLSX', fileSize: '250 KB', date: '10 Dec 2025' },
  { id: 13, title: 'Civil Service Code of Conduct', category: 'policy', description: 'The official code of conduct governing the behaviour and ethical standards of all civil servants.', fileType: 'PDF', fileSize: '1.8 MB', date: '5 Jun 2025' },
  { id: 14, title: '2024 Civil Service Annual Performance Report', category: 'report', description: 'Comprehensive annual performance report covering all aspects of Civil Service operations in 2024.', fileType: 'PDF', fileSize: '4.2 MB', date: '12 May 2025' },
  { id: 15, title: 'Policy on Onboarding and Orientation for the Ghana Civil Service', category: 'policy', description: 'Official policy establishing structured onboarding and orientation programmes for new civil servants.', fileType: 'PDF', fileSize: '1.5 MB', date: '29 Apr 2025' },
  { id: 16, title: 'OHCS Strategic Medium-Term Development Plan 2022-2025', category: 'report', description: 'Strategic plan outlining key objectives, priorities, and targets for OHCS over the medium term.', fileType: 'PDF', fileSize: '5.1 MB', date: '14 Oct 2024' },
  { id: 17, title: 'Civil Service Client Service Charter', category: 'policy', description: 'Charter setting out the standards of service delivery that citizens can expect from the Civil Service.', fileType: 'PDF', fileSize: '890 KB', date: '14 Oct 2024' },
  { id: 18, title: 'Civil Service Administrative Instructions', category: 'policy', description: 'Official administrative instructions governing day-to-day operations in the Ghana Civil Service.', fileType: 'PDF', fileSize: '2.1 MB', date: '14 Oct 2024' },
  { id: 19, title: 'Staff Performance Appraisal Report Template', category: 'form', description: 'Standard template for conducting and recording annual staff performance appraisals.', fileType: 'XLSX', fileSize: '95 KB', date: '14 Oct 2024' },
  { id: 20, title: 'Ghana Civil Service Training Policy and Guidelines', category: 'policy', description: 'Comprehensive training policy and implementation guidelines for capacity building across the Civil Service.', fileType: 'PDF', fileSize: '1.4 MB', date: '14 Oct 2024' },
  { id: 21, title: 'Civil Service Workplace Safety and Health Response Strategy', category: 'policy', description: 'Strategy document for ensuring workplace safety and health standards across civil service institutions.', fileType: 'PDF', fileSize: '1.1 MB', date: '14 Oct 2024' },
  { id: 22, title: 'CS Sexual Harassment Policy', category: 'policy', description: 'Official policy on preventing and addressing sexual harassment in the Ghana Civil Service.', fileType: 'PDF', fileSize: '980 KB', date: '14 Oct 2024' },
  { id: 23, title: 'Guidelines on Study Leave (2017 Review)', category: 'circular', description: 'Guidelines governing the application and approval process for study leave for civil servants.', fileType: 'PDF', fileSize: '650 KB', date: '14 Oct 2024' },
  { id: 24, title: 'Bond Form Template', category: 'form', description: 'Standard bond form template for civil servants receiving government-sponsored training or scholarships.', fileType: 'PDF', fileSize: '180 KB', date: '14 Oct 2024' },
  { id: 25, title: '1992 Constitution of the Republic of Ghana', category: 'report', description: 'The full text of the 1992 Constitution establishing the legal framework for the Civil Service.', fileType: 'PDF', fileSize: '3.8 MB', date: '14 Oct 2024' },
];

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
};

export default function PublicationsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const filtered = SAMPLE_DOCS
    .filter((doc) => {
      const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
      const matchesSearch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCategoryChange = (key: CategoryKey) => {
    setActiveCategory(key);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

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
                onClick={() => handleCategoryChange(cat.key)}
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} document{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' && ` in ${CATEGORIES.find((c) => c.key === activeCategory)?.label}`}
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </p>
          </div>

          {/* Document cards */}
          <div className="space-y-4">
            {paginated.map((doc) => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                    currentPage === 1
                      ? 'text-text-muted/30 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/5 border-2 border-primary/10 hover:border-primary/30',
                  )}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, i, arr) => {
                    const prev = arr[i - 1];
                    const showEllipsis = prev !== undefined && page - prev > 1;
                    return (
                      <span key={page} className="flex items-center gap-2">
                        {showEllipsis && <span className="text-text-muted/30 px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200',
                            page === currentPage
                              ? 'bg-primary text-white shadow-md'
                              : 'text-text-muted hover:bg-primary/5 border-2 border-border/40 hover:border-primary/20',
                          )}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                    currentPage === totalPages
                      ? 'text-text-muted/30 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/5 border-2 border-primary/10 hover:border-primary/30',
                  )}
                >
                  Next
                </button>
              </div>
            )}

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
