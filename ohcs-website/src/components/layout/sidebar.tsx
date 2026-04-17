import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarLink {
  label: string;
  href: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

interface SidebarProps {
  sections: SidebarSection[];
  className?: string;
}

export function Sidebar({ sections, className }: SidebarProps) {
  return (
    <aside aria-label="Sidebar navigation" className={cn('space-y-8', className)}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <h3 className="font-body font-semibold text-sm text-text mb-2">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.links.map((link, linkIndex) => (
              <li key={linkIndex}>
                <Link
                  href={link.href}
                  className="block text-sm text-text-muted hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
