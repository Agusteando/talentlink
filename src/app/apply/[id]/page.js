// --- src\app\apply\[id]\page.js ---
import { db } from '@/lib/db';
import ApplyForm from '@/components/public/ApplyForm'; // Extract form to client component
import { MapPin, Building2 } from 'lucide-react';

// Server Component to fetch Job Data
export default async function ApplyPage({ params }) {
  const job = await db.job.findUnique({
      where: { id: params.id },
      include: { plantel: true } // Fetch Plantel details
  });

  if (!job || job.status !== 'OPEN') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="p-10 bg-white rounded-xl shadow-lg text-center">
                <h1 className="text-xl font-bold text-slate-800 mb-2">Vacante no disponible</h1>
                <p className="text-slate-500">Esta vacante ha sido cerrada o no existe.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            
            {/* Left: Job Info & Map */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-xl text-slate-800 mb-2">{job.title}</h2>
                    <div className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wide text-xs">{job.department}</div>
                    
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm text-slate-600">
                            <Building2 size={18} className="mt-0.5 text-slate-400 shrink-0"/> 
                            <div>
                                <strong className="block text-slate-800">Campus</strong>
                                {job.plantel.name}
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-slate-600">
                            <MapPin size={18} className="mt-0.5 text-slate-400 shrink-0"/> 
                            <div>
                                <strong className="block text-slate-800">Ubicación</strong>
                                {job.plantel.address}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Embed if lat/long exist */}
                {job.plantel.lat && job.plantel.lng && (
                    <div className="bg-slate-200 rounded-xl h-64 overflow-hidden shadow-inner border border-slate-300">
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${job.plantel.lat},${job.plantel.lng}&z=15&output=embed`}
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>

            {/* Right: Application Form */}
            <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-xl p-8 border border-slate-100">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Formulario de Postulación</h1>
                    <p className="text-sm text-slate-500 mb-8">Completa tus datos para aplicar a esta vacante. No es necesario iniciar sesión si eres un candidato externo.</p>
                    
                    <ApplyForm jobId={job.id} />
                </div>
            </div>
        </div>
    </div>
  );
}