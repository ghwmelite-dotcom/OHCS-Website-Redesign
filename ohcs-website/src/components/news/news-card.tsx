import Link from 'next/link';
import Image from 'next/image';
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
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg block"
    >
      <Card hoverable kenteAccent className="flex gap-4 p-4">
        {article.thumbnailUrl && (
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={article.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <time className="text-xs text-text-muted block mb-1">
            {article.publishedAt ? formatDateShort(article.publishedAt) : ''}
          </time>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-xs text-text-muted line-clamp-2">{article.excerpt}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
