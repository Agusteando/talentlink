// --- src\components\dashboard\jobs\JobRow.jsx ---
'use client';
import Link from 'next/link';
import { Edit, Eye, Trash2, Calendar, Building2 } from 'lucide-react';
import { deleteJob } from '@/actions/job-actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function JobRow({ job, isAdmin }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar esta vacante? Se borrará permanentemente.")) return;
    
    const res = await deleteJob(job.id);
    if (res.success) {
        toast.success("Vacante eliminada");
        router.refresh();
    } else {
        toast.error(res.error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col h-full">
        <div className="p-6 flex-1">
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
                    <Building2 size={12} /> {job.plantel.name}
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
                        {job.closingDate ? new Date(job.closingDate).toLocaleDateString() : 'Sin fecha'}
                    </div>
                    <span>Cierre</span>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                <Link 
                href={`/apply/${job.id}`} 
                target="_blank"
                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                >
                <Eye size={14} /> Ver Pública
                </Link>

                {isAdmin && (
                <div className="flex gap-2">
                    <button 
                        onClick={handleDelete}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition shadow-sm"
                        title="Eliminar Vacante"
                    >
                        <Trash2 size={14} />
                    </button>
                    <Link 
                        href={`/dashboard/jobs/${job.id}/edit`} 
                        className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
                    >
                        <Edit size={14} /> Editar
                    </Link>
                </div>
                )}
        </div>
    </div>
  );
}