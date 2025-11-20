import { db } from '@/lib/db';
import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, PlusCircle, Users, LogOut } from 'lucide-react';
import { signOut } from '@/auth'; // Note: signOut in server component requires action form

export default async function Dashboard() {
  const session = await auth();
  if (!session || session.user.role === 'CANDIDATE') redirect('/my-applications');

  // Filter Logic
  const whereClause = session.user.role === 'DIRECTOR' 
    ? { job: { plantel: session.user.plantel } }
    : {}; // ADMIN/RH sees all

  const applications = await db.application.findMany({
    where: whereClause,
    include: { job: true, user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png" className="h-8" alt="Logo" />
            <span className="border-l border-gray-300 pl-3 font-medium text-slate-500">
                {session.user.role === 'ADMIN' ? 'Administrador Global' : `Director ${session.user.plantel}`}
            </span>
          </div>
          
          <div className="flex gap-3">
            {session.user.role === 'ADMIN' && (
                <>
                  <Link href="/dashboard/users" className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    <Users size={16} /> Usuarios
                  </Link>
                  <Link href="/dashboard/jobs/new" className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">
                    <PlusCircle size={16} /> Nueva Vacante
                  </Link>
                </>
            )}
            <form action={async () => { 'use server'; await signOut(); }}>
               <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50">
                 <LogOut size={16} />
               </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-400">Candidatos</h3>
            <p className="mt-2 text-3xl font-bold text-slate-800">{applications.length}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-400">Entrevistas</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
                {applications.filter(a => a.status === 'INTERVIEW').length}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-400">Contratados</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
                {applications.filter(a => a.status === 'HIRED').length}
            </p>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-slate-50/50 px-6 py-4">
            <h2 className="font-bold text-slate-800">Flujo de Talento</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-slate-400">
                  <th className="px-6 py-4 font-semibold">Candidato</th>
                  <th className="px-6 py-4 font-semibold">Vacante</th>
                  <th className="px-6 py-4 font-semibold text-center">Tracking IDs</th>
                  <th className="px-6 py-4 font-semibold text-center">Etapa</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="group hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.fullName}</div>
                      <div className="text-xs text-slate-500">{app.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{app.job.title}</div>
                      <div className="text-xs text-blue-600">{app.job.plantel}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            <span className={`block h-2 w-2 rounded-full ${app.signiaId ? 'bg-green-500' : 'bg-gray-200'}`} title="Signia"></span>
                            <span className={`block h-2 w-2 rounded-full ${app.evaId ? 'bg-green-500' : 'bg-gray-200'}`} title="Eva"></span>
                            <span className={`block h-2 w-2 rounded-full ${app.pathId ? 'bg-green-500' : 'bg-gray-200'}`} title="Path"></span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold 
                        ${app.status === 'NEW' ? 'bg-slate-100 text-slate-600' : 
                          app.status === 'HIRED' ? 'bg-green-100 text-green-700' : 
                          app.status === 'INTERVIEW' ? 'bg-blue-100 text-blue-700' : 
                          'bg-red-50 text-red-600'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/application/${app.id}`} className="text-sm font-bold text-slate-400 hover:text-blue-600 hover:underline">
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}