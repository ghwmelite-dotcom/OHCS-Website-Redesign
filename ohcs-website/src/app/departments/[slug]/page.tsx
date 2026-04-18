import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/breadcrumb';
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
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb
        items={[
          { label: 'Departments', href: '/departments' },
          { label: department.name },
        ]}
      />

      <div className="mt-8 max-w-3xl">
        <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3">
          {department.shortName}
        </span>
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-6">
          {department.name}
        </h1>

        <div className="space-y-6 text-lg text-text-muted leading-relaxed">
          <p>{department.description}</p>
        </div>
      </div>
    </div>
  );
}
