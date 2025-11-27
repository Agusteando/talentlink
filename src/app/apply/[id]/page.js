import { db } from '@/lib/db';
import ApplyForm from '@/components/public/ApplyForm'; 
import { MapPin, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ApplyPage({ params }) {
  const job = await db.job.findUnique({
      where: { id: params.id },
      include: { plantel: true } 
  });

  if (!job || job.status !== 'OPEN') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-mesh-gradient">
            <div className="p-12 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl text-center border border-slate-100">
                <h1 className="font-outfit text-2xl font-bold text-slate-800 mb-2">Vacante no disponible</h1>
                <p className="text-slate-500 mb-6">Esta vacante ha sido cerrada o no existe.</p>
                <Link href="/" className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm">Volver al Inicio</Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto mb-6">
             <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700 transition">
                <ArrowLeft size={16} /> Volver a vacantes
             </Link>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
            
            {/* Left: Job Info */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-white">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 border border-emerald-100">
                        {job.type}
                    </span>
                    <h2 className="font-outfit font-extrabold text-3xl text-slate-900 mb-2 leading-tight">{job.title}</h2>
                    <div className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-wide text-xs">{job.department}</div>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                            <div className="bg-white p-2 rounded-full shadow-sm text-blue-500">
                                <Building2 size={20} /> 
                            </div>
                            <div>
                                <strong className="block text-slate-900 font-bold text-sm">Campus</strong>
                                <span className="text-slate-600 text-sm">{job.plantel.name}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                             <div className="bg-white p-2 rounded-full shadow-sm text-emerald-500">
                                <MapPin size={20} /> 
                            </div>
                            <div>
                                <strong className="block text-slate-900 font-bold text-sm">Ubicación</strong>
                                <span className="text-slate-600 text-sm">{job.plantel.address}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Embed */}
                {job.plantel.lat && job.plantel.lng && (
                    <div className="bg-white p-2 rounded-[2rem] shadow-md border border-white">
                        <div className="rounded-[1.5rem] overflow-hidden h-64 bg-slate-200">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={`https://maps.google.com/maps?q=${job.plantel.lat},${job.plantel.lng}&z=15&output=embed`}
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Application Form */}
            <div className="lg:col-span-8">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-8 md:p-12 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-bl-[100%] -z-0"></div>
                    
                    <div className="relative z-10">
                        <h1 className="font-outfit text-2xl font-bold text-slate-900 mb-2">Formulario de Postulación</h1>
                        <p className="text-sm text-slate-500 mb-8 max-w-lg">Completa tus datos para aplicar. Tu información será enviada directamente al departamento de Recursos Humanos.</p>
                        
                        <ApplyForm jobId={job.id} />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}