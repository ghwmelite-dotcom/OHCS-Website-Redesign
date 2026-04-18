'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicationCategory } from '@/types';

interface PubRow {
  id: number;
  title: string;
  category: PublicationCategory;
  fileType: 'PDF' | 'DOCX' | 'XLSX';
  date: string;
}

const SAMPLE_PUBS: PubRow[] = [
  { id: 1, title: 'Annual Report 2024', category: 'report', fileType: 'PDF', date: '15 Jan 2025' },
  { id: 2, title: 'Conditions of Service for Civil Servants', category: 'policy', fileType: 'PDF', date: '10 Dec 2024' },
  { id: 3, title: 'Application for Study Leave — Form CS/SL/01', category: 'form', fileType: 'PDF', date: '5 Nov 2024' },
  { id: 4, title: 'Circular: Revised Salary Structure 2025', category: 'circular', fileType: 'DOCX', date: '2 Mar 2025' },
  { id: 5, title: 'Public Service Commission Policy Framework', category: 'policy', fileType: 'PDF', date: '20 Feb 2025' },
  { id: 6, title: 'Staff Headcount Data Q1 2025', category: 'report', fileType: 'XLSX', date: '1 Apr 2025' },
];

const CATEGORY_COLORS: Record<PublicationCategory, string> = {
  report: 'bg-blue-100 text-blue-800',
  policy: 'bg-purple-100 text-purple-800',
  form: 'bg-amber-100 text-amber-800',
  circular: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-600',
};

const CATEGORY_LABELS: Record<PublicationCategory, string> = {
  report: 'Report',
  policy: 'Policy',
  form: 'Form',
  circular: 'Circular',
  other: 'Other',
};

export default function AdminPublicationsPage() {
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_PUBS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Publications</h2>
          <p className="text-sm text-text-muted mt-1">Manage reports, policies, forms, and circulars available for download.</p>
        </div>
        <Link
          href="/admin/publications/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Upload Document
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search publications..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">File Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                  No publications found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark max-w-xs truncate">
                    {row.title}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        CATEGORY_COLORS[row.category],
                      )}
                    >
                      {CATEGORY_LABELS[row.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-700">
                      {row.fileType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">{row.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label="View publication"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Edit publication"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Delete publication"
                        className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
