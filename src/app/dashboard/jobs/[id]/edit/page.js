import { db } from '@/lib/db';
import { auth } from '@/auth';
import { updateJob } from '@/actions/job-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default async function EditJobPage({ params }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const job = await db.job.findUnique({
    where: { id: params.id }
  });

  if (!job) return <div>Vacante no encontrada</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
                <Link href="/dashboard" className="rounded-full bg-white p-2 text-slate-600 shadow hover:bg-slate-100">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Editar Vacante</h1>
           </div>
           <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
             {job.status}
           </span>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form action={updateJob} className="space-y-6">
            <input type="hidden" name="jobId" value={job.id} />
            
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Título</label>
              <input type="text" name="title" defaultValue={job.title} required 
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Plantel</label>
                <select name="plantel" defaultValue={job.plantel} className="w-full rounded-lg border border-gray-300 p-3 bg-white">
                  {['PM','PT','SM','ST','PREET','PREEM','ISM','IS','CT','CM','DM','CO'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Departamento</label>
                <input type="text" name="department" defaultValue={job.department} required 
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" />
              </div>
               <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Estado</label>
                <select name="status" defaultValue={job.status} className="w-full rounded-lg border border-gray-300 p-3 bg-white">
                   <option value="OPEN">Abierta</option>
                   <option value="CLOSED">Cerrada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Descripción</label>
              <textarea name="description" rows={8} defaultValue={job.description} required 
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"></textarea>
            </div>

            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-bold text-white hover:bg-slate-800">
              <Save size={20} /> Guardar Cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}