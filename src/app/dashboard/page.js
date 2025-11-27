import { db } from "@/lib/db";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, LogOut, ChevronLeft, ChevronRight, MoreHorizontal, PlusCircle, Clock, Star, CalendarDays
} from "lucide-react";
import { signOut } from "@/auth";
import ExportButton from "@/components/dashboard/ExportButton";
import SearchInput from "@/components/dashboard/SearchInput";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { getApplicationStatusLabel } from "@/lib/status-labels";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function isNew(date) {
  const diff = new Date() - new Date(date);
  return diff < 24 * 60 * 60 * 1000;
}

export default async function Dashboard({ searchParams }) {
  const session = await auth();
  if (!session || session.user.role === "CANDIDATE") redirect("/");

  const query = searchParams?.query || "";
  const showFavorites = searchParams?.filter === "favorites";
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const skip = (currentPage - 1) * itemsPerPage;

  let whereClause = { AND: [] };

  if (session.user.role === "DIRECTOR") {
    if (session.user.plantelId) whereClause.AND.push({ job: { plantelId: session.user.plantelId } });
    else whereClause.AND.push({ id: "none" });
  }

  if (query) {
    whereClause.AND.push({
      OR: [
        { fullName: { contains: query } },
        { user: { email: { contains: query } } },
        { job: { title: { contains: query } } },
      ],
    });
  }

  if (showFavorites) whereClause.AND.push({ OR: [{ isFavorite: true }, { status: "TALENT_POOL" }] });

  const [applications, totalCount, allAppsForStats, checklistTemplates] =
    await Promise.all([
      db.application.findMany({
        where: whereClause,
        include: { job: { include: { plantel: true } }, user: true, checklistValues: true },
        orderBy: { createdAt: "desc" },
        take: itemsPerPage,
        skip,
      }),
      db.application.count({ where: whereClause }),
      db.application.findMany({ where: whereClause, select: { status: true, isFavorite: true } }),
      db.checklistTemplate.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const interviewApps = allAppsForStats.filter((a) => a.status === "INTERVIEW").length;
  const poolApps = allAppsForStats.filter((a) => a.isFavorite || a.status === "TALENT_POOL").length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
         <div>
            <h1 className="font-outfit text-3xl font-bold text-slate-900">Panel Principal</h1>
            <p className="text-slate-500 mt-1">Visión general del proceso de reclutamiento.</p>
         </div>
         <div className="flex gap-3">
             <Link
              href="/dashboard/jobs/new"
              className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-600 transition-all hover:shadow-blue-900/20"
            >
              <PlusCircle size={18} />
              <span>Nueva Vacante</span>
            </Link>
         </div>
      </div>

      {/* STATS CARDS - Rounded 2XL */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Candidatos" value={totalCount} color="slate" />
          <StatCard title="En Entrevista" value={interviewApps} color="blue" />
          <StatCard title="Cartera (Pool)" value={poolApps} color="purple" />
          <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center h-full">
            <ExportButton applications={applications} checklistTemplates={checklistTemplates} />
          </div>
      </div>

      {/* TABLE - Rounded 3XL */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
         <div className="border-b border-slate-100 bg-white px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-outfit font-bold text-lg text-slate-800">Candidatos Recientes</h3>
              <Link
                href={showFavorites ? "/dashboard" : "/dashboard?filter=favorites"}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition ${
                  showFavorites
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-500"
                }`}
              >
                <Star size={14} fill={showFavorites ? "currentColor" : "none"} /> Cartera
              </Link>
            </div>
            <SearchInput placeholder="Buscar candidato..." />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-8 py-5 font-bold">Candidato</th>
                  <th className="px-8 py-5 font-bold">Vacante</th>
                  <th className="px-8 py-5 font-bold">Estado</th>
                  <th className="px-8 py-5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.length === 0 ? (
                  <tr><td colSpan="4" className="px-8 py-12 text-center text-slate-400">Sin resultados.</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="group hover:bg-blue-50/30 transition">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                                    {app.fullName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        {app.fullName}
                                        {isNew(app.createdAt) && <span className="text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">NUEVO</span>}
                                    </div>
                                    <div className="text-xs text-slate-500">{app.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <div className="font-bold text-slate-700">{app.job.title}</div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{app.job.plantel.name}</span>
                        </td>
                        <td className="px-8 py-5">
                             <StatusBadge status={app.status} />
                             {app.interviewDate && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                    <CalendarDays size={10} /> {format(new Date(app.interviewDate), 'dd MMM HH:mm', { locale: es })}
                                </div>
                             )}
                        </td>
                        <td className="px-8 py-5 text-right">
                             <Link href={`/dashboard/application/${app.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition">
                                <MoreHorizontal size={16} />
                             </Link>
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center">
             <Link href={`/dashboard?page=${Math.max(1, currentPage - 1)}&query=${query}`} className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-full border ${currentPage <= 1 ? 'opacity-50 pointer-events-none border-transparent' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <ChevronLeft size={14}/> Anterior
             </Link>
             <span className="text-xs font-bold text-slate-400">Página {currentPage} de {totalPages || 1}</span>
             <Link href={`/dashboard?page=${Math.min(totalPages, currentPage + 1)}&query=${query}`} className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-full border ${currentPage >= totalPages ? 'opacity-50 pointer-events-none border-transparent' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                Siguiente <ChevronRight size={14}/>
             </Link>
          </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
    const colors = {
        slate: 'text-slate-900',
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        emerald: 'text-emerald-600'
    };
    return (
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
            <h3 className={`text-4xl font-outfit font-extrabold ${colors[color] || 'text-slate-900'}`}>{value}</h3>
        </div>
    );
}

function StatusBadge({ status }) {
    const label = getApplicationStatusLabel(status);
    let styles = "bg-slate-100 text-slate-600 border-slate-200";
    if (status === 'HIRED') styles = "bg-emerald-50 text-emerald-700 border-emerald-100";
    else if (status === 'INTERVIEW') styles = "bg-indigo-50 text-indigo-700 border-indigo-100";
    else if (status === 'TALENT_POOL') styles = "bg-purple-50 text-purple-700 border-purple-100";
    else if (status === 'REJECTED') styles = "bg-red-50 text-red-600 border-red-100";

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles}`}>
            {label}
        </span>
    );
}