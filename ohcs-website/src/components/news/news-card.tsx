import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatDateShort } from '@/lib/utils';
import type { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl block group/news"
    >
      <Card hoverable kenteAccent className="flex gap-5 p-5">
        {article.thumbnailUrl && (
          <div className="relative w-28 h-28 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={article.thumbnailUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover/news:scale-110"
              sizes="112px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <time className="text-sm text-accent font-medium block mb-2">
            {article.publishedAt ? formatDateShort(article.publishedAt) : ''}
          </time>
          <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2 group-hover/news:text-primary transition-colors duration-200">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">{article.excerpt}</p>
          )}
        </div>
        <ArrowUpRight
          className="h-5 w-5 text-text-muted/30 group-hover/news:text-primary shrink-0 mt-1 transition-all duration-200 group-hover/news:translate-x-0.5 group-hover/news:-translate-y-0.5"
          aria-hidden="true"
        />
      </Card>
    </Link>
  );
}
