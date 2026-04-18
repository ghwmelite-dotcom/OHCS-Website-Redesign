'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderCard {
  id: number;
  name: string;
  title: string;
  sortOrder: number;
  isFeatured: boolean;
  initials: string;
}

const SAMPLE_LEADERS: LeaderCard[] = [
  { id: 1, name: 'Dr. Kwadwo Afari-Gyan', title: 'Head of Civil Service', sortOrder: 1, isFeatured: true, initials: 'KA' },
  { id: 2, name: 'Mrs. Abena Osei-Mensah', title: 'Deputy Head of Civil Service', sortOrder: 2, isFeatured: true, initials: 'AO' },
  { id: 3, name: 'Mr. Emmanuel Asante-Boa', title: 'Director, Human Resource Management', sortOrder: 3, isFeatured: false, initials: 'EA' },
  { id: 4, name: 'Ms. Faustina Agyemang', title: 'Director, Training & Development', sortOrder: 4, isFeatured: false, initials: 'FA' },
  { id: 5, name: 'Mr. Kofi Darko-Mensah', title: 'Director, Finance & Administration', sortOrder: 5, isFeatured: false, initials: 'KD' },
];

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
];

export default function AdminLeadershipPage() {
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_LEADERS.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Leadership Profiles</h2>
          <p className="text-sm text-text-muted mt-1">Manage leadership profiles displayed on the About page.</p>
        </div>
        <Link
          href="/admin/leadership/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Profile
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search profiles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-border/40 p-12 text-center">
          <p className="text-sm text-text-muted">No profiles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((leader, idx) => (
            <div
              key={leader.id}
              className="bg-white rounded-2xl border-2 border-border/40 p-6 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                {/* Avatar */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold',
                    AVATAR_COLORS[idx % AVATAR_COLORS.length],
                  )}
                  aria-hidden="true"
                >
                  {leader.initials}
                </div>

                {/* Featured badge */}
                {leader.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    Featured
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-primary-dark leading-snug mb-1">{leader.name}</h3>
              <p className="text-sm text-text-muted mb-4 leading-snug">{leader.title}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted/60 font-medium">Order: {leader.sortOrder}</span>
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Edit ${leader.name}`}
                    className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Delete ${leader.name}`}
                    className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
