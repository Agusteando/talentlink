import { db } from '@/lib/db';
import { applyJob } from '@/actions/job-actions';
import { Upload, CheckCircle, Briefcase, MapPin, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function ApplyPage({ params }) {
  // 1. Fetch the Job Details
  const job = await db.job.findUnique({
    where: { id: params.id }
  });

  if (!job) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Header for this page */}
      <div className="bg-white border-b border-gray-200 py-6 px-8">
        <div className="container mx-auto">
            <h1 className="text-2xl font-extrabold text-slate-900">{job.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1"><Briefcase size={16} /> {job.department}</span>
                <span className="flex items-center gap-1"><MapPin size={16} /> {job.plantel}</span>
                <span className="flex items-center gap-1"><Clock size={16} /> {job.type}</span>
            </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8">
        <div className="grid gap-8 lg:grid-cols-5">
            
          {/* LEFT COLUMN: Job Description */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Descripción del Puesto</h2>
                {/* Render description preserving whitespace */}
                <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-600">
                    {job.description}
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Application Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-white rounded-xl p-6 shadow-xl border border-blue-100">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Postúlate Ahora</h3>
                    <p className="text-sm text-slate-500">Completa tus datos para iniciar el proceso.</p>
                </div>

                <form action={applyJob} className="space-y-5">
                    <input type="hidden" name="jobId" value={job.id} />
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                        <input type="text" name="fullName" required className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                            <input type="tel" name="phone" required className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Email de Contacto</label>
                            <input type="email" name="email" required className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none" />
                        </div>
                    </div>

                    {/* CV Upload UI */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tu CV (PDF/Word)</label>
                        <div className="relative flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-blue-500" />
                                    <p className="text-xs text-slate-500 font-bold">Clic para subir archivo</p>
                                    <p className="text-xs text-slate-400">PDF, DOC, DOCX (Max 5MB)</p>
                                </div>
                                <input type="file" name="cv" accept=".pdf,.doc,.docx" className="hidden" required />
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md">
                        Enviar Postulación
                    </button>
                </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}