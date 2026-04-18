'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [saved, setSaved] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaved(true);
    setTimeout(() => router.push('/admin/news'), 1500);
  };

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-primary-dark mb-2">Article Created!</h2>
        <p className="text-text-muted">Redirecting to news management...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/news" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted hover:text-primary-dark hover:bg-primary/5 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Create News Article</h2>
          <p className="text-sm text-text-muted mt-0.5">Add a new article to the site</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-border/40 p-8 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-primary-dark mb-2">Title <span className="text-red-500">*</span></label>
          <input id="title" type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} required placeholder="Enter article title"
            className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-semibold text-primary-dark mb-2">Slug</label>
          <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-gray-50 text-sm text-text-muted focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label htmlFor="excerpt" className="block text-sm font-semibold text-primary-dark mb-2">Excerpt</label>
          <textarea id="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief summary of the article"
            className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none" />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-primary-dark mb-2">Content <span className="text-red-500">*</span></label>
          <textarea id="content" rows={10} value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Full article content..."
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
          <Link href="/admin/news" className="px-5 py-2.5 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:text-primary-dark transition-colors">Cancel</Link>
          <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">Create Article</button>
        </div>
      </form>
    </div>
  );
}
