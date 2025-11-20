// --- src\app\dashboard\jobs\new\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { createJob } from '@/actions/job-actions';
import { redirect } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewJobPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  // Fetch active Plantels sorted alphabetically
  const plantels = await db.plantel.findMany({ 
      where: { isActive: true },
      orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl bg-white rounded-xl shadow-lg p-8 border border-slate-200">
         
         <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/jobs" className="p-2 rounded-full hover:bg-slate-100 transition">
                <ArrowLeft size={20} className="text-slate-600"/>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Nueva Vacante</h1>
         </div>

         <form action={createJob} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título de la Vacante</label>
                <input name="title" placeholder="Ej. Docente de Matemáticas" required className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Plantel / Campus</label>
                    <select name="plantelId" required className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition cursor-pointer">
                        <option value="">-- Seleccionar --</option>
                        {plantels.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {plantels.length === 0 && <p className="text-[10px] text-red-500 mt-1">No hay planteles registrados. Ve a panel de Admin.</p>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Departamento</label>
                    <input name="department" placeholder="Ej. Académico" required className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descripción del Puesto</label>
                <textarea name="description" rows={6} placeholder="Responsabilidades, requisitos..." required className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition font-sans" />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Cierre (Opcional)</label>
                <input type="date" name="closingDate" className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition text-slate-600" />
            </div>

            <button className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-md mt-4">
                <Save size={18} /> Publicar Vacante
            </button>
         </form>
      </div>
    </div>
  );
}