'use client';
import { applyJob } from '@/actions/job-actions'; // Named import
import { Upload, Briefcase, MapPin, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ApplyPage({ params }) {
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch job details client-side or pass from server component wrapper
  // For simplicity in this fix, we assume we fetch basic info or render static
  // If you prefer Server Component wrapper, let me know, but this fixes the Import error.
  
  // To keep it robust without changing the whole structure, let's keep the logic 
  // that submits the form. 

  async function handleSubmit(formData) {
    const res = await applyJob(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("¡Postulación enviada con éxito!");
      router.push('/my-applications');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Postulación</h1>
            <form action={handleSubmit} className="space-y-5">
                <input type="hidden" name="jobId" value={params.id} />
                
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                    <input type="text" name="fullName" required className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                        <input type="tel" name="phone" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                        <input type="email" name="email" required className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tu CV (PDF)</label>
                    <input type="file" name="cv" accept=".pdf" className="w-full p-2 border rounded" required />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md">
                    Enviar Solicitud
                </button>
            </form>
        </div>
    </div>
  );
}