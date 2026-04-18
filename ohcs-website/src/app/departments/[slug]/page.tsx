import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { DEPARTMENTS } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DEPARTMENTS.map((dept) => ({ slug: dept.slug }));
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const department = DEPARTMENTS.find((d) => d.slug === slug);

  if (!department) {
    notFound();
  }

  return (
    <>
      <PageHero
        title={department.name}
        breadcrumbs={[
          { label: 'Departments', href: '/departments' },
          { label: department.name },
        ]}
        accent="warm"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-3xl">
          <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3">
            {department.shortName}
          </span>

          <div className="space-y-6 text-lg text-text-muted leading-relaxed">
            <p>{department.description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
