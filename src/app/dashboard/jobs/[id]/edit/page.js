// --- src\app\dashboard\jobs\[id]\edit\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import JobForm from '@/components/dashboard/jobs/JobForm';

export default async function EditJobPage({ params }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const [job, plantels] = await Promise.all([
      db.job.findUnique({ where: { id: params.id } }),
      db.plantel.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);

  if (!job) return <div>Vacante no encontrada</div>;

  return (
    <JobForm plantels={plantels} initialData={job} isEdit={true} />
  );
}