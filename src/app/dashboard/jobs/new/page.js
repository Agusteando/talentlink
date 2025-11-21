// --- src\app\dashboard\jobs\new\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import JobForm from '@/components/dashboard/jobs/JobForm';
import { PERMISSIONS } from '@/lib/permissions';

export default async function NewJobPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
      redirect('/dashboard');
  }

  // Filter dropdown for 1:N Plantels
  let plantelWhere = { isActive: true };
  if (!session.user.isGlobal) {
      plantelWhere.id = { in: session.user.plantelIds || [] };
  }

  const [plantels, jobTitles] = await Promise.all([
      db.plantel.findMany({ 
          where: plantelWhere,
          orderBy: { name: 'asc' }
      }),
      db.jobTitle.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
      })
  ]);

  return (
    <JobForm plantels={plantels} jobTitles={jobTitles} isEdit={false} />
  );
}