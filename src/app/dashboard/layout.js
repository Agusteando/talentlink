// --- src\app\dashboard\layout.js ---
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  // 1. Security Check: Must be logged in
  if (!session) {
    redirect('/');
  }

  // 2. Role Check: Candidates cannot be here
  if (session.user.role === 'CANDIDATE') {
    redirect('/my-applications');
  }

  // 3. Render Layout with Persistent Header
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader user={session.user} />
      <main className="flex-1 container mx-auto max-w-7xl p-6">
        {children}
      </main>
    </div>
  );
}