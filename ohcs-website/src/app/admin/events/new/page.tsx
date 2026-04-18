'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaved(true);
    setTimeout(() => router.push('/admin/events'), 1500);
  };

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-primary-dark mb-2">Event Created!</h2>
        <p className="text-text-muted">Redirecting to events management...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted hover:text-primary-dark hover:bg-primary/5 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Create Event</h2>
          <p className="text-sm text-text-muted mt-0.5">Add a new event to the calendar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-border/40 p-8 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-primary-dark mb-2">Event Title <span className="text-red-500">*</span></label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Civil Service Week Opening Ceremony"
            className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-primary-dark mb-2">Start Date <span className="text-red-500">*</span></label>
            <input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-primary-dark mb-2">End Date</label>
            <input id="endDate" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-primary-dark mb-2">Location</label>
          <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Accra International Conference Centre"
            className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-primary-dark mb-2">Description</label>
          <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Event details and agenda..."
            className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-primary-dark mb-2">Status</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStatus('draft')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${status === 'draft' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Draft</button>
            <button type="button" onClick={() => setStatus('published')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Published</button>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-border/30">
          <Link href="/admin/events" className="px-5 py-2.5 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:text-primary-dark transition-colors">Cancel</Link>
          <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">Create Event</button>
        </div>
      </form>
    </div>
  );
}
