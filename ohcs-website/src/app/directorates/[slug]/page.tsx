import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { DIRECTORATES } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DIRECTORATES.map((dir) => ({ slug: dir.slug }));
}

export default async function DirectorateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const directorate = DIRECTORATES.find((d) => d.slug === slug);

  if (!directorate) {
    notFound();
  }

  return (
    <>
      <PageHero
        title={directorate.name}
        subtitle={directorate.description.length > 160 ? directorate.description.slice(0, 160) + '…' : directorate.description}
        breadcrumbs={[
          { label: 'Directorates', href: '/directorates' },
          { label: directorate.name },
        ]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-3xl">
          <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3">
            {directorate.shortName}
          </span>

          <div className="space-y-6 text-lg text-text-muted leading-relaxed">
            <p>{directorate.description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
