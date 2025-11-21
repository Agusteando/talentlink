// --- src\app\dashboard\application\[id]\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import Timeline from '@/components/dashboard/Timeline';
import StatusManager from '@/components/dashboard/StatusManager'; 
import FavoriteButton from '@/components/dashboard/FavoriteButton'; 
import InterviewScheduler from '@/components/dashboard/InterviewScheduler'; 
import DynamicChecklist from '@/components/dashboard/DynamicChecklist'; // NEW
import { ArrowLeft, Download, FileText, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ApplicationDetail({ params }) {
  const session = await auth();
  if (!session) redirect('/');

  // Fetch App with Checklist Values
  const app = await db.application.findUnique({
    where: { id: params.id },
    include: { 
        job: true, 
        user: true,
        checklistValues: true, // Fetch saved values
        comments: {
            include: { user: true },
            orderBy: { createdAt: 'asc' }
        }
    }
  });

  // Fetch Checklist Configuration (Templates)
  const templates = await db.checklistTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
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
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {app.fullName}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-blue-600">{app.job.title}</span>
                    <span>•</span>
                    <span>{app.job.plantel?.name}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3 items-center">
             <FavoriteButton applicationId={app.id} initialStatus={app.isFavorite} />
             {app.cvUrl && (
                 <a href={app.cvUrl} download className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition shadow-sm">
                    <Download size={16} /> Descargar CV
                 </a>
             )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: PDF */}
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
        </div>

        {/* RIGHT: Modules */}
        <div className="w-[400px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col shadow-xl z-20">
            
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Contacto</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-700">
                        <Mail size={16} className="text-blue-500" />
                        <span>{app.user?.email || app.email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-700">
                        <Phone size={16} className="text-green-500" />
                        <span>{app.phone || 'No registrado'}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 pb-0 bg-slate-50">
                 <InterviewScheduler 
                    applicationId={app.id} 
                    initialDate={app.interviewDate} 
                    status={app.status}
                 />
                 
                 {/* DYNAMIC CHECKLIST MODULE */}
                 <DynamicChecklist 
                    applicationId={app.id} 
                    templates={templates} 
                    existingValues={app.checklistValues}
                 />
            </div>

            <div className="flex-1 p-6 pt-2 bg-slate-50">
                <Timeline 
                    applicationId={app.id} 
                    comments={app.comments} 
                    currentUser={session.user} 
                />
            </div>

            <StatusManager applicationId={app.id} currentStatus={app.status} />
        </div>
      </div>
    </div>
  );
}