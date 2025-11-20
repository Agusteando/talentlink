// --- src\components\dashboard\jobs\JobForm.jsx ---
'use client';

import { useState } from 'react';
import { createJob, updateJob } from '@/actions/job-actions';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function JobForm({ initialData, plantels, isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    
    let res;
    if (isEdit) {
        res = await updateJob(formData);
    } else {
        res = await createJob(formData);
    }
    
    setLoading(false);

    if (res?.error) {
        toast.error(res.error);
    } else {
        toast.success(isEdit ? "Vacante actualizada correctamente" : "Vacante publicada con éxito");
        router.push('/dashboard/jobs');
        router.refresh();
    }
  }

  // Format Date for Input if editing
  const dateValue = initialData?.closingDate 
    ? new Date(initialData.closingDate).toISOString().split('T')[0] 
    : '';

  return (
    <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/jobs" className="p-2 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-100 text-slate-600 transition">
                <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">
                {isEdit ? `Editar: ${initialData.title}` : 'Crear Nueva Vacante'}
            </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <form action={handleSubmit} className="space-y-6">
                {isEdit && <input type="hidden" name="jobId" value={initialData.id} />}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título del Puesto</label>
                    <input 
                        name="title" 
                        defaultValue={initialData?.title} 
                        required 
                        placeholder="Ej. Coordinador Académico"
                        className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-medium" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plantel</label>
                        <select 
                            name="plantelId" 
                            defaultValue={initialData?.plantelId} 
                            required 
                            className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition cursor-pointer"
                        >
                            <option value="">-- Seleccionar --</option>
                            {plantels.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Departamento</label>
                        <input 
                            name="department" 
                            defaultValue={initialData?.department} 
                            required 
                            placeholder="Ej. Control Escolar"
                            className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estado de la Vacante</label>
                        <select 
                            name="status" 
                            defaultValue={initialData?.status || 'OPEN'} 
                            className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition"
                        >
                            <option value="OPEN">🟢 Activa (Recibiendo CVs)</option>
                            <option value="PAUSED">🟡 Pausada (Visible, sin aplicar)</option>
                            <option value="HIDDEN">⚪ Oculta (Borrador)</option>
                            <option value="CLOSED">🔴 Cerrada (Archivada)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha Límite (Opcional)</label>
                        <input 
                            type="date" 
                            name="closingDate" 
                            defaultValue={dateValue}
                            className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition text-slate-600" 
                        />
                     </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción Detallada</label>
                    <textarea 
                        name="description" 
                        defaultValue={initialData?.description} 
                        rows={8} 
                        required 
                        placeholder="Describe las responsabilidades, requisitos y beneficios..."
                        className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition font-sans leading-relaxed" 
                    />
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Publicar Vacante')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}