import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {/* Home item — text instead of icon */}
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 hover:opacity-100 opacity-70 transition-opacity font-medium"
          >
            Home
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
              {isLast ? (
                <span className="font-semibold opacity-100" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link href={item.href} className="hover:opacity-100 opacity-70 transition-opacity font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="opacity-70">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
