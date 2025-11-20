import { db } from '@/lib/db';
import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PlusCircle, Edit, Eye, Trash2, Calendar, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function JobsManagementPage() {
  const session = await auth();
  // Candidates don't have access here
  if (!session || session.user.role === 'CANDIDATE') redirect('/my-applications');

  // --- PERMISSION FILTER ---
  let whereClause = {};
  
  if (session.user.role === 'DIRECTOR') {
      const allowed = (session.user.allowedPlantels || '').split(',').filter(Boolean);
      if (allowed.length > 0) {
          whereClause = { plantel: { in: allowed } };
      } else {
          whereClause = { id: 'none' };
      }
  }

  // Fetch Jobs with Application Count
  const jobs = await db.job.findMany({
    where: whereClause,
    include: {
        _count: {
            select: { applications: true }
        }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Gestión de Vacantes</h1>
                <p className="text-slate-500">Administra tus ofertas laborales y sus fechas de cierre.</p>
            </div>
            <Link href="/dashboard/jobs/new" className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 shadow-lg transition-all">
               <PlusCircle size={18} /> Nueva Vacante
            </Link>
        </div>

        {/* Data Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                job.status === 'OPEN' ? 'bg-green-50 text-green-700 border-green-100' :
                                job.status === 'CLOSED' ? 'bg-red-50 text-red-700 border-red-100' :
                                job.status === 'PAUSED' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                {job.status === 'OPEN' ? 'Activa' : 
                                 job.status === 'CLOSED' ? 'Cerrada' : 
                                 job.status === 'PAUSED' ? 'Pausada' : 'Oculta'}
                            </div>
                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <Building2 size={12} /> {job.plantel}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{job.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{job.department}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-lg">{job._count.applications}</span>
                                <span>Candidatos</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1 font-bold text-slate-700">
                                    <Calendar size={12} />
                                    {job.closingDate ? job.closingDate.toLocaleDateString() : 'Sin fecha'}
                                </div>
                                <span>Cierre</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                         <Link 
                           href={`/apply/${job.id}`} 
                           className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                           target="_blank"
                         >
                            <Eye size={14} /> Ver Pública
                         </Link>

                         <div className="flex gap-2">
                            {/* Since there is no "Delete" logic requested yet, Edit allows changing status to Closed/Hidden */}
                            <Link 
                                href={`/dashboard/jobs/${job.id}/edit`} 
                                className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
                            >
                                <Edit size={14} /> Editar
                            </Link>
                         </div>
                    </div>
                </div>
            ))}
        </div>

        {jobs.length === 0 && (
            <div className="text-center py-20">
                <p className="text-slate-400 mb-4">No has publicado ninguna vacante aún.</p>
                <Link href="/dashboard/jobs/new" className="text-blue-600 font-bold hover:underline">
                    Crear la primera
                </Link>
            </div>
        )}

      </div>
    </div>
  );
}