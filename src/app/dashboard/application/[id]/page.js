import { db } from '@/lib/db';
import { updateApplicationStatus } from '@/actions/job-actions';
import ProcessControl from '@/components/dashboard/ProcessControl';
import { ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function ApplicationDetail({ params }) {
  const app = await db.application.findUnique({
    where: { id: params.id },
    include: { job: true, user: true }
  });

  if (!app) return <div>Aplicación no encontrada</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-xl font-bold text-slate-800">{app.fullName}</h1>
                <p className="text-xs text-slate-500">{app.job.title} • {app.job.plantel}</p>
            </div>
        </div>
        <div className="flex gap-2">
             <a href={app.cvUrl} download className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900">
                <Download size={16} /> Descargar CV
             </a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: PDF Viewer */}
        <div className="flex-1 bg-slate-200 p-4 overflow-hidden relative">
             {app.cvUrl ? (
                 app.cvUrl.endsWith('.pdf') ? (
                    <iframe src={app.cvUrl} className="w-full h-full rounded shadow-lg bg-white" />
                 ) : (
                    <iframe 
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${process.env.NEXT_PUBLIC_BASE_URL}${app.cvUrl}`} 
                        className="w-full h-full rounded shadow-lg bg-white" 
                    />
                 )
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={64} />
                    <p>No hay documento visualizable</p>
                 </div>
             )}
        </div>

        {/* RIGHT: Controls */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-6 space-y-8">
            
            {/* Contact Info */}
            <div className="text-sm">
                <h3 className="font-bold text-slate-800 mb-2">Contacto</h3>
                <p className="text-slate-600">Email: {app.user.email}</p>
                <p className="text-slate-600">Tel: {app.phone || 'N/A'}</p>
                <p className="text-slate-600">Contacto Alt: {app.email || 'N/A'}</p>
            </div>

            {/* 1. Tracking IDs Form */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                 <h3 className="font-bold text-indigo-900 text-sm mb-3">Integración de Sistemas</h3>
                 <form action={async (fd) => {
                    'use server';
                    await updateApplicationStatus(app.id, {
                        signiaId: fd.get('signiaId'),
                        evaId: fd.get('evaId'),
                        pathId: fd.get('pathId')
                    });
                 }} className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-indigo-600 block mb-1">Signia ID</label>
                        <input name="signiaId" defaultValue={app.signiaId} placeholder="---" className="w-full p-2 text-sm border border-indigo-200 rounded bg-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-600 block mb-1">Eva ID</label>
                        <input name="evaId" defaultValue={app.evaId} placeholder="---" className="w-full p-2 text-sm border border-indigo-200 rounded bg-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-600 block mb-1">Path ID</label>
                        <input name="pathId" defaultValue={app.pathId} placeholder="---" className="w-full p-2 text-sm border border-indigo-200 rounded bg-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700">
                        Guardar IDs
                    </button>
                 </form>
            </div>

            {/* 2. Interactive Process Control */}
            <ProcessControl 
                applicationId={app.id} 
                currentStage={app.interviewStage} 
                currentStatus={app.status}
            />

            {/* 3. Final Decision */}
            <div className="pt-6 border-t border-gray-100">
                 <label className="block text-sm font-bold text-slate-800 mb-2">Decisión Final</label>
                 <form action={async (fd) => {
                    'use server';
                    await updateApplicationStatus(app.id, { status: fd.get('status') });
                 }}>
                     <select 
                        name="status" 
                        defaultValue={app.status} 
                        className="w-full p-3 border border-gray-300 rounded-lg bg-slate-50 text-sm font-bold mb-3"
                     >
                        <option value="NEW">Nuevo / En Revisión</option>
                        <option value="INTERVIEW">En Entrevistas</option>
                        <option value="HIRED">✅ Contratado</option>
                        <option value="REJECTED">❌ Descartado</option>
                     </select>
                     <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black">
                        Actualizar Estado
                     </button>
                 </form>
            </div>

        </div>
      </div>
    </div>
  );
}