import { db } from '@/lib/db';
import { auth } from '@/auth';
import { updateApplicationStatus } from '@/actions/job-actions';
import ProcessControl from '@/components/dashboard/ProcessControl';
import Timeline from '@/components/dashboard/Timeline';
import { ArrowLeft, Download, FileText, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ApplicationDetail({ params }) {
  const session = await auth();
  if (!session) redirect('/');

  // Fetch Application, Job, User, and Comments (Threaded)
  const app = await db.application.findUnique({
    where: { id: params.id },
    include: { 
        job: true, 
        user: true,
        comments: {
            include: { user: true },
            orderBy: { createdAt: 'asc' }
        }
    }
  });

  if (!app) return <div className="p-8 text-center">Aplicación no encontrada</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-xl font-bold text-slate-800">{app.fullName}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-blue-600">{app.job.title}</span>
                    <span>•</span>
                    <span>{app.job.plantel}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
             {app.cvUrl && (
                 <a href={app.cvUrl} download className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition shadow-sm">
                    <Download size={16} /> Descargar CV
                 </a>
             )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: PDF Viewer */}
        <div className="flex-1 bg-slate-200 p-4 overflow-hidden relative flex flex-col">
             {app.cvUrl ? (
                 <div className="flex-1 rounded-xl shadow-inner bg-white overflow-hidden border border-slate-300">
                     {app.cvUrl.endsWith('.pdf') ? (
                        <iframe src={app.cvUrl} className="w-full h-full" />
                     ) : (
                        <iframe 
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${process.env.NEXT_PUBLIC_BASE_URL}${app.cvUrl}`} 
                            className="w-full h-full" 
                        />
                     )}
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={64} className="mb-4 opacity-20" />
                    <p>No hay documento visualizable</p>
                 </div>
             )}
             
             {/* Extracted Text Preview (Optional helper) */}
             {app.cvText && (
                <div className="mt-4 h-32 bg-white rounded-lg p-4 overflow-y-auto text-xs text-slate-500 border border-slate-300 shadow-sm">
                    <strong className="block mb-1 text-slate-700">Texto Detectado (IA):</strong>
                    {app.cvText.substring(0, 500)}...
                </div>
             )}
        </div>

        {/* RIGHT: Controls & Timeline */}
        <div className="w-[400px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col shadow-xl z-20">
            
            {/* 1. Contact Info Card */}
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Información de Contacto</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-700">
                        <Mail size={16} className="text-blue-500" />
                        <span>{app.user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-700">
                        <Phone size={16} className="text-green-500" />
                        <span>{app.phone || 'No registrado'}</span>
                    </div>
                    {app.email && app.email !== app.user.email && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-700">
                            <Mail size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Alt: {app.email}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Process Control (Stages) */}
            <div className="p-6 border-b border-slate-100">
                 <ProcessControl 
                    applicationId={app.id} 
                    currentStage={app.interviewStage} 
                    currentStatus={app.status}
                />
            </div>

            {/* 3. Tracking IDs */}
            <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
                 <h3 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                    <Shield size={14}/> IDs de Sistema
                 </h3>
                 <form action={async (fd) => {
                    'use server';
                    await updateApplicationStatus(app.id, {
                        signiaId: fd.get('signiaId'),
                        evaId: fd.get('evaId'),
                        pathId: fd.get('pathId')
                    });
                 }} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-indigo-600 block mb-1">Signia</label>
                            <input name="signiaId" defaultValue={app.signiaId} className="w-full px-2 py-1 text-xs border border-indigo-200 rounded focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-indigo-600 block mb-1">Eva</label>
                            <input name="evaId" defaultValue={app.evaId} className="w-full px-2 py-1 text-xs border border-indigo-200 rounded focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-indigo-600 block mb-1">Path</label>
                            <input name="pathId" defaultValue={app.pathId} className="w-full px-2 py-1 text-xs border border-indigo-200 rounded focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                    <button className="w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition">
                        Guardar IDs
                    </button>
                 </form>
            </div>

            {/* 4. Collaborative Timeline */}
            <div className="flex-1 p-6 bg-slate-50">
                <Timeline 
                    applicationId={app.id} 
                    comments={app.comments} 
                    currentUser={session.user} 
                />
            </div>

            {/* 5. Final Decision Sticky Footer */}
            <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                 <form action={async (fd) => {
                    'use server';
                    await updateApplicationStatus(app.id, { status: fd.get('status') });
                 }}>
                     <select 
                        name="status" 
                        defaultValue={app.status} 
                        className={`w-full p-3 border rounded-lg text-sm font-bold mb-3 outline-none
                            ${app.status === 'HIRED' ? 'bg-green-50 border-green-200 text-green-700' : 
                              app.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' : 
                              'bg-white border-slate-300 text-slate-700'}`}
                     >
                        <option value="NEW">Nuevo / En Revisión</option>
                        <option value="INTERVIEW">En Entrevistas</option>
                        <option value="HIRED">✅ Contratado</option>
                        <option value="REJECTED">❌ Descartado</option>
                     </select>
                     <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-blue-600 transition shadow-lg">
                        Actualizar Estado y Notificar
                     </button>
                 </form>
            </div>

        </div>
      </div>
    </div>
  );
}