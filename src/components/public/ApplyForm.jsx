// --- src\components\public\ApplyForm.jsx ---
'use client';
import { applyJob } from '@/actions/job-actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

export default function ApplyForm({ jobId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);

  async function handleSubmit(formData) {
    setLoading(true);
    
    // Get the token from the captcha component
    const token = recaptchaRef.current.getValue();
    formData.append('g-recaptcha-response', token || '');

    const res = await applyJob(formData);
    
    if (res?.error) {
      setLoading(false);
      toast.error(res.error);
      recaptchaRef.current.reset(); // Reset captcha on error
    } else {
      toast.success("¡Postulación enviada con éxito!");
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
        
        <div className="grid md:grid-cols-2 gap-6">
            <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Nombre Completo</label>
                <input type="text" name="fullName" required className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Teléfono</label>
                <input type="tel" name="phone" required className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Email</label>
                <input type="email" name="email" required className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Tu CV (PDF)</label>
            <div className="relative group">
                <input type="file" name="cv" accept=".pdf" className="w-full p-3 border border-gray-300 rounded-lg bg-slate-50 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-blue-600 transition cursor-pointer" required />
                <Upload size={18} className="absolute right-4 top-3.5 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Solo archivos .PDF (Max 5MB)</p>
        </div>

        {/* Google ReCAPTCHA */}
        <div className="flex justify-center py-2">
             <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                theme="light"
            />
        </div>

        <button disabled={loading} type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]">
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Validando y Enviando...' : 'Confirmar Postulación'}
        </button>
    </form>
  );
}