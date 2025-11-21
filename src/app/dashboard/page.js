// --- src\app\dashboard\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  Clock,
  Star
} from 'lucide-react';
import { signOut } from '@/auth';
import ExportButton from '@/components/dashboard/ExportButton';
import SearchInput from '@/components/dashboard/SearchInput';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

function isNew(date) {
  const now = new Date();
  const diff = now - new Date(date);
  return diff < 24 * 60 * 60 * 1000;
}

export default async function Dashboard({ searchParams }) {
  const session = await auth();
  // BLOCK CANDIDATES entirely if they somehow slipped through
  if (!session || session.user.role === 'CANDIDATE') redirect('/');

  const query = searchParams?.query || '';
  const showFavorites = searchParams?.filter === 'favorites';
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10; 
  const skip = (currentPage - 1) * itemsPerPage;

  let whereClause = {
    AND: []
  };

  if (session.user.role === 'DIRECTOR') {
      if (session.user.plantelId) {
        whereClause.AND.push({ job: { plantelId: session.user.plantelId } });
      } else {
        whereClause.AND.push({ id: 'none' }); 
      }
  }

  if (query) {
      whereClause.AND.push({
        OR: [
            { fullName: { contains: query } },
            { user: { email: { contains: query } } },
            { job: { title: { contains: query } } },
            // NEW: SEARCH INSIDE PDF CONTENT
            { cvText: { contains: query } } 
        ]
      });
  }

  if (showFavorites) {
      whereClause.AND.push({
          OR: [
              { isFavorite: true },
              { status: 'TALENT_POOL' }
          ]
      });
  }

  const [applications, totalCount, allAppsForStats] = await Promise.all([
    db.application.findMany({
        where: whereClause,
        include: { job: { include: { plantel: true } }, user: true },
        orderBy: { createdAt: 'desc' },
        take: itemsPerPage,
        skip: skip
    }),
    db.application.count({ where: whereClause }),
    db.application.findMany({
        where: whereClause,
        select: { status: true, createdAt: true, isFavorite: true }
    })
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const totalAppsStat = allAppsForStats.length;
  const interviewApps = allAppsForStats.filter(a => a.status === 'INTERVIEW').length;
  const poolApps = allAppsForStats.filter(a => a.isFavorite || a.status === 'TALENT_POOL').length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-200 shadow-lg">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">TalentLink</h1>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                 <span className="uppercase tracking-wider">{session.user.role}</span>
                 <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                 <span>{session.user.role === 'DIRECTOR' ? (session.user.plantelName || 'Sin Asignar') : 'Vista Global'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* RH and ADMIN see global options */}
            {(session.user.role === 'ADMIN' || session.user.role === 'RH') && (
               <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500">
                   <span className="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase tracking-wide">Modo Global</span>
               </div>
            )}
            
            <Link href="/dashboard/jobs/new" className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-blue-600 transition-all">
               <PlusCircle size={16} />
               <span className="hidden md:inline">Nueva Vacante</span>
            </Link>

            <form action={async () => { 'use server'; await signOut(); }}>
               <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                 <LogOut size={18} />
               </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* STATS */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Total Candidatos</p>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{totalAppsStat}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-blue-400 uppercase tracking-wide">En Entrevista</p>
            <h3 className="mt-2 text-3xl font-extrabold text-blue-700">{interviewApps}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-purple-500 uppercase tracking-wide">Cartera (Pool)</p>
            <h3 className="mt-2 text-3xl font-extrabold text-purple-700">{poolApps}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center">
             <ExportButton applications={applications} />
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
           <div className="border-b border-slate-100 bg-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-slate-800">Candidatos Recientes</h3>
                <Link 
                    href={showFavorites ? '/dashboard' : '/dashboard?filter=favorites'}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition
                    ${showFavorites 
                        ? 'bg-amber-50 text-amber-600 border-amber-200' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-500'}`}
                >
                    <Star size={14} fill={showFavorites ? "currentColor" : "none"} />
                    Cartera
                </Link>
             </div>
             <SearchInput placeholder="Buscar por nombre, email o CV..." />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Candidato</th>
                  <th className="px-6 py-4 font-bold">Vacante</th>
                  <th className="px-6 py-4 font-bold">Actividad</th>
                  <th className="px-6 py-4 font-bold text-center">Estado</th>
                  <th className="px-6 py-4 font-bold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length === 0 ? (
                   <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">Sin resultados.</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="group transition hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {app.fullName.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                    {app.fullName}
                                    {app.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400"/>}
                                    {isNew(app.createdAt) && <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold">NUEVO</span>}
                                </div>
                                <div className="text-xs text-slate-500">{app.email}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{app.job.title}</div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {app.job.plantel.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true, locale: es })}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border
                          ${app.status === 'NEW' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                            app.status === 'HIRED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                            app.status === 'INTERVIEW' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 
                            app.status === 'TALENT_POOL' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                            'bg-red-50 text-red-600 border-red-100'}`}>
                          {app.status === 'NEW' ? 'En Revisión' : 
                           app.status === 'TALENT_POOL' ? 'En Cartera' : app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/application/${app.id}`} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all">
                          <MoreHorizontal size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION */}
          <div className="border-t border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
             <Link href={`/dashboard?page=${currentPage > 1 ? currentPage - 1 : 1}&query=${query}&filter=${showFavorites ? 'favorites' : ''}`} className={`flex items-center gap-1 text-sm font-bold px-3 py-2 rounded-lg transition ${currentPage <= 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                <ChevronLeft size={16} /> Anterior
             </Link>
             <Link href={`/dashboard?page=${currentPage < totalPages ? currentPage + 1 : totalPages}&query=${query}&filter=${showFavorites ? 'favorites' : ''}`} className={`flex items-center gap-1 text-sm font-bold px-3 py-2 rounded-lg transition ${currentPage >= totalPages ? 'text-slate-300 pointer-events-none' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                Siguiente <ChevronRight size={16} />
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}