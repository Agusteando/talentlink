// --- src\app\dashboard\users\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import UserManagementRow from '@/components/dashboard/UserManagementRow'; 
import { PERMISSIONS } from '@/lib/permissions';

export default async function UsersPage() {
  const session = await auth();
  
  // PERMISSION CHECK: Manage Users
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_USERS)) {
      redirect('/dashboard');
  }

  // Fetch Users, Plantels, AND ROLES
  const [users, plantels, roles] = await Promise.all([
      db.user.findMany({ 
          orderBy: { createdAt: 'desc' }, 
          include: { 
              plantel: true,
              role: true // Include Role info
          } 
      }),
      db.plantel.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      db.role.findMany({ orderBy: { name: 'asc' } })
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
            <Link href="/dashboard/settings" className="rounded-full bg-white p-2 shadow hover:bg-slate-100">
                <ArrowLeft size={20} className="text-slate-600"/>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Control de Usuarios</h1>
                <p className="text-slate-500">Asigna roles y planteles al personal.</p>
            </div>
        </div>

        <div className="space-y-4">
            {users.map(user => (
                <UserManagementRow 
                    key={user.id} 
                    user={user} 
                    plantels={plantels}
                    roles={roles} // Pass Roles to Client Component
                />
            ))}
        </div>
      </div>
    </div>
  );
}