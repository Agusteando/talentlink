// --- src\app\dashboard\jobs\[id]\edit\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import JobForm from '@/components/dashboard/jobs/JobForm';
import { PERMISSIONS } from '@/lib/permissions';

export default async function EditJobPage({ params }) {
  const session = await auth();
  
  // FIX: Permission Check
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
      return redirect('/dashboard');
  }

  const [job, plantels, jobTitles] = await Promise.all([
      db.job.findUnique({ where: { id: params.id } }),
      db.plantel.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      db.jobTitle.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);

  if (!job) return <div>Vacante no encontrada</div>;

  return (
    <JobForm 
        plantels={plantels} 
        jobTitles={jobTitles}
        initialData={job} 
        isEdit={true} 
    />
  );
}