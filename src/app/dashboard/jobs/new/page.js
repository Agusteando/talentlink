'use client';
import { createJob } from '@/actions/job-actions';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
      <Save size={20} />
      {pending ? 'Guardando...' : 'Publicar Vacante'}
    </button>
  );
}

export default function NewJobPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard" className="rounded-full bg-white p-2 text-slate-600 shadow hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Crear Nueva Vacante</h1>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form action={createJob} className="space-y-6">
            
            {/* Job Title */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Título del Puesto</label>
              <input type="text" name="title" placeholder="Ej. Docente de Inglés" required 
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Grid for Plantel & Dept */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Plantel</label>
                <select name="plantel" className="w-full rounded-lg border border-gray-300 p-3 bg-white focus:border-blue-500 focus:outline-none">
                  {['PM','PT','SM','ST','PREET','PREEM','ISM','IS','CT','CM','DM','CO'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Departamento</label>
                <input type="text" name="department" placeholder="Ej. Academia / Mantenimiento" required 
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Descripción del Puesto</label>
              <textarea name="description" rows={6} placeholder="Responsabilidades, requisitos..." required 
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"></textarea>
            </div>

            <div className="flex justify-end border-t pt-6">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}