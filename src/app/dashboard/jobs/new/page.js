// --- src\app\dashboard\jobs\new\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import JobForm from '@/components/dashboard/jobs/JobForm';

export default async function NewJobPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const plantels = await db.plantel.findMany({ 
      where: { isActive: true },
      orderBy: { name: 'asc' }
  });

  return (
    // Just pass data to the Client Component
    <JobForm plantels={plantels} isEdit={false} />
  );
}