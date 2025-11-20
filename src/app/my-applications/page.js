import { db } from '@/lib/db';
import { auth } from '@/auth';
import Header from '@/components/ui/Header'; // Reuse the header
import { redirect } from 'next/navigation';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

export default async function MyApplications() {
  const session = await auth();
  if (!session) redirect('/');

  const myApps = await db.application.findMany({
    where: { userId: session.user.id },
    include: { job: true },
    orderBy: { createdAt: 'desc' }
  });

  const getStatusColor = (status) => {
    switch(status) {
        case 'HIRED': return 'bg-green-100 text-green-700 border-green-200';
        case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
        case 'INTERVIEW': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
        case 'HIRED': return <CheckCircle size={20} />;
        case 'REJECTED': return <XCircle size={20} />;
        default: return <Clock size={20} />;
    }
  };

  // Dummy setter for Header since this is a Server Component wrapper, 
  // simpler to just hardcode Header inside a client wrapper or just pass static props if Header allows
  // For this example, we assume Header is client-side safe or we mock the lang prop.

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">Mis Postulaciones</h1>
            <div className="text-sm text-slate-500">{session.user.email}</div>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4">
        {myApps.length === 0 ? (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-300">No tienes postulaciones activas</h2>
                <p className="text-slate-500 mt-2">Busca una vacante en la página principal.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {myApps.map(app => (
                    <div key={app.id} className="flex flex-col md:flex-row justify-between items-start md:items-center rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition hover:shadow-xl">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{app.job.title}</h3>
                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">{app.job.plantel}</span>
                                <span>•</span>
                                <span>Aplicado el {app.createdAt.toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className={`mt-4 md:mt-0 flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            <span>{app.status === 'NEW' ? 'En Revisión' : app.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}