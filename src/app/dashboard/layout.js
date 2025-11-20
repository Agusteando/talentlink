// --- src/app/dashboard/layout.js ---
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

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

  // 3. If authorized, render the Admin UI
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}