// --- src\app\dashboard\jobs\[id]\edit\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { updateJob } from '@/actions/job-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default async function EditJobPage({ params }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const [job, plantels] = await Promise.all([
    db.job.findUnique({ where: { id: params.id } }),
    db.plantel.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);

  if (!job) return <div className="p-8 text-center">Vacante no encontrada</div>;

  // Format date correctly for HTML input
  const dateValue = job.closingDate ? job.closingDate.toISOString().split('T')[0] : '';

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
                <Link href="/dashboard/jobs" className="rounded-full bg-white p-2 text-slate-600 shadow hover:bg-slate-100 transition">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Editar Vacante</h1>
           </div>
           <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
             job.status === 'OPEN' ? 'bg-green-100 text-green-800 border-green-200' : 
             job.status === 'CLOSED' ? 'bg-red-100 text-red-800 border-red-200' :
             'bg-slate-100 text-slate-800 border-slate-200'
           }`}>
             {job.status}
           </span>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg border border-slate-200">
          <form action={updateJob} className="space-y-6">
            <input type="hidden" name="jobId" value={job.id} />
            
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Título</label>
              <input type="text" name="title" defaultValue={job.title} required 
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Plantel</label>
                <select name="plantelId" defaultValue={job.plantelId} className="w-full rounded-lg border border-gray-300 p-3 bg-white focus:border-blue-500 focus:outline-none">
                  {plantels.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Departamento</label>
                <input type="text" name="department" defaultValue={job.department} required 
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Estado</label>
                    <select name="status" defaultValue={job.status} className="w-full rounded-lg border border-gray-300 p-3 bg-white focus:border-blue-500 focus:outline-none">
                        <option value="OPEN">🟢 Activa (Recibiendo)</option>
                        <option value="PAUSED">🟡 Pausada (Visible, No aplica)</option>
                        <option value="HIDDEN">⚪ Oculta (Borrador)</option>
                        <option value="CLOSED">🔴 Cerrada (Archivada)</option>
                    </select>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Fecha de Cierre</label>
                    <input 
                        type="date" 
                        name="closingDate" 
                        defaultValue={dateValue}
                        className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" 
                    />
                </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Descripción</label>
              <textarea name="description" rows={8} defaultValue={job.description} required 
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none font-sans"></textarea>
            </div>

            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-bold text-white hover:bg-blue-700 transition-all shadow-md">
              <Save size={20} /> Guardar Cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}