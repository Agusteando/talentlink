// --- src\app\dashboard\jobs\new\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import JobForm from '@/components/dashboard/jobs/JobForm';
import { PERMISSIONS } from '@/lib/permissions';

export default async function NewJobPage() {
  const session = await auth();
  
  // OLD LOGIC (BROKEN): if (session?.user?.role !== 'ADMIN') ...
  // NEW LOGIC (FIXED): Check Permission
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
      return redirect('/dashboard');
  }

  // Fetch dependencies for the form
  const [plantels, jobTitles] = await Promise.all([
      db.plantel.findMany({ 
          where: { isActive: true },
          orderBy: { name: 'asc' }
      }),
      db.jobTitle.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
      })
  ]);

  return (
    <JobForm 
        plantels={plantels} 
        jobTitles={jobTitles} 
        isEdit={false} 
    />
  );
}