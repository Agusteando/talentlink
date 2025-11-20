import { db } from '@/lib/db';
import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import UserRoleForm from '@/components/dashboard/UserRoleForm'; // This imports the 'export default'

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="rounded-full bg-white p-2 shadow hover:bg-slate-100 transition">
                    <ArrowLeft size={20} className="text-slate-600"/>
                </Link>
                <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
            </div>
            <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                Total: {users.length}
            </div>
        </div>

        <div className="grid gap-4">
            {users.map(user => (
                <div key={user.id} className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between transition hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                            {user.image ? (
                                <img src={user.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xl font-bold text-slate-400">{user.name?.[0]}</span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{user.name || 'Usuario sin nombre'}</h3>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                    </div>

                    <UserRoleForm user={user} />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}