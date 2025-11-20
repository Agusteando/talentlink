// --- src\components\public\ApplyForm.jsx ---
'use client';
import { applyJob } from '@/actions/job-actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Upload } from 'lucide-react';

export default function ApplyForm({ jobId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Simple Math Captcha State to prevent bots
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  
  useEffect(() => {
      setCaptcha({
          num1: Math.floor(Math.random() * 10),
          num2: Math.floor(Math.random() * 10)
      });
  }, []);

  async function handleSubmit(formData) {
    setLoading(true);
    const res = await applyJob(formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("¡Postulación enviada!");
      // If guest, go to thank you page. If user, go to my-applications
      if (res.isGuest) {
          router.push('/thank-you');
      } else {
          router.push('/my-applications');
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="jobId" value={jobId} />
        
        <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
            <input type="text" name="fullName" required placeholder="Ej. Juan Pérez" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 outline-none transition" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                <input type="tel" name="phone" required placeholder="55 1234 5678" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email de Contacto</label>
                <input type="email" name="email" required placeholder="juan@email.com" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 outline-none transition" />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tu CV (PDF)</label>
            <div className="relative">
                <input type="file" name="cv" accept=".pdf" className="w-full p-3 border rounded-lg bg-slate-50 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
                <Upload size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Formato PDF, Máximo 5MB.</p>
        </div>

        {/* Simple Captcha UI */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-blue-800">
                 <ShieldCheck size={16} />
                 <label className="text-xs font-bold">Verificación de Seguridad</label>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">¿Cuánto es {captcha.num1} + {captcha.num2}?</span>
                <input type="hidden" name="expectedCaptcha" value={captcha.num1 + captcha.num2} />
                <input 
                    type="number" 
                    name="captcha" 
                    required 
                    placeholder="?" 
                    className="w-20 rounded border border-blue-200 p-1 text-center text-sm outline-none focus:border-blue-500" 
                />
            </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? 'Enviando postulación...' : 'Enviar Solicitud Ahora'}
        </button>
    </form>
  );
}