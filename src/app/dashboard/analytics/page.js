// --- src\app\dashboard\analytics\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PERMISSIONS } from '@/lib/permissions';
import { BarChart3, Users, Clock, CheckCircle } from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD)) {
      redirect('/dashboard');
  }

  // Fetch Data
  const [totalApps, hiredApps, jobs] = await Promise.all([
      db.application.count(),
      db.application.findMany({
          where: { status: 'HIRED' },
          select: { createdAt: true, updatedAt: true }
      }),
      db.job.findMany({
          include: { _count: { select: { applications: true } } }
      })
  ]);

  // Calculate Metrics
  const avgTimeToHire = hiredApps.reduce((acc, app) => {
      const diffTime = Math.abs(new Date(app.updatedAt) - new Date(app.createdAt));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return acc + diffDays;
  }, 0) / (hiredApps.length || 1);

  const hiredCount = hiredApps.length;
  const conversionRate = totalApps > 0 ? ((hiredCount / totalApps) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Analíticas de Reclutamiento</h1>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                    <Users size={20} /> <span className="text-xs font-bold uppercase">Total Postulaciones</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{totalApps}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-emerald-600">
                    <CheckCircle size={20} /> <span className="text-xs font-bold uppercase">Contratados</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-700">{hiredCount}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-blue-500">
                    <BarChart3 size={20} /> <span className="text-xs font-bold uppercase">Tasa de Conversión</span>
                </div>
                <div className="text-3xl font-extrabold text-blue-700">{conversionRate}%</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-purple-500">
                    <Clock size={20} /> <span className="text-xs font-bold uppercase">Tiempo Promedio</span>
                </div>
                <div className="text-3xl font-extrabold text-purple-700">{Math.round(avgTimeToHire)} <span className="text-sm font-medium text-slate-400">días</span></div>
            </div>
        </div>

        {/* JOBS PERFORMANCE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 text-sm">
                Rendimiento por Vacante
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400 bg-white border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">Vacante</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Candidatos</th>
                            <th className="px-6 py-3 w-1/3">Popularidad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {jobs.map(job => {
                            const maxApps = Math.max(...jobs.map(j => j._count.applications));
                            const percent = maxApps > 0 ? (job._count.applications / maxApps) * 100 : 0;
                            
                            return (
                                <tr key={job.id}>
                                    <td className="px-6 py-3 font-bold text-slate-700">{job.title}</td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold ${job.status === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono">{job._count.applications}</td>
                                    <td className="px-6 py-3">
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}