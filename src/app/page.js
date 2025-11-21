
// --- src\app\page.js ---
import { db } from "@/lib/db";
import Header from "@/components/ui/Header";
import Link from "next/link";
import { Search, MapPin, Briefcase, ArrowRight, Sparkles, Building2, Calendar } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

function isJobNew(date) {
    const diff = new Date() - new Date(date);
    return diff < 3 * 24 * 60 * 60 * 1000; 
}

export default async function Home({ searchParams }) {
  const session = await auth();

  // Server-side redirect: If authenticated staff (dashboard access), send to dashboard
  if (session?.user) {
    const canView = session.user.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD) 
      || session.user.roleName === 'Super Admin' 
      || session.user.isGlobal;
    // Debug: Validate redirect logic
    console.log('[Home] session redirect check', { email: session.user.email, canView });
    if (canView) {
      redirect('/dashboard');
    }
  }

  const query = searchParams?.q || "";
  const plantelId = searchParams?.plantel || "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const whereClause = {
    status: "OPEN",
    AND: [
        { OR: [{ closingDate: null }, { closingDate: { gte: today } }] }
    ],
    ...(query && { title: { contains: query } }),
    ...(plantelId && { plantelId: plantelId }),
  };

  const [jobs, plantels] = await Promise.all([
    db.job.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: { plantel: true } 
    }),
    db.plantel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    })
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-slate-900 py-24 lg:py-32">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-transparent to-slate-900"></div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-sm font-medium text-blue-300 mb-8 backdrop-blur-sm">
            <Sparkles size={14} />
            <span>Reclutamiento 2025 Activo</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
            Descubre tu futuro en IECS-IEDIS
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 mb-10">
            Forma parte de una institución líder. Explora nuestras oportunidades académicas y administrativas.
          </p>
          
          <form className="mx-auto max-w-4xl relative z-10">
            <div className="flex flex-col md:flex-row gap-2 p-2 bg-white rounded-2xl shadow-2xl shadow-blue-900/20">
              <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-100">
                <Search className="text-slate-400" size={20} />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={query}
                  placeholder="Ej. Docente, Coordinador..." 
                  className="w-full p-3 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400" 
                />
              </div>
              <div className="flex-1 flex items-center px-4">
                <MapPin className="text-slate-400" size={20} />
                <select 
                  name="plantel"
                  defaultValue={plantelId}
                  className="w-full p-3 bg-transparent border-none outline-none text-slate-800 cursor-pointer"
                >
                  <option value="">Todos los Planteles</option>
                  {plantels.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/30">
                Buscar Vacantes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- JOBS GRID --- */}
      <main className="container mx-auto py-20 px-4">
        <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="text-blue-600" size={24} /> Oportunidades Recientes
            </h2>
            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                {jobs.length} vacantes
            </span>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
             <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-lg font-medium text-slate-500">No se encontraron vacantes activas en este momento.</p>
             <Link href="/" className="text-blue-600 font-bold mt-2 inline-block hover:underline">Ver todas</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
               const isNew = isJobNew(job.createdAt);
               return (
                <div key={job.id} className="group relative flex flex-col justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
                    {isNew && (
                        <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-blue-600/20">
                            NUEVO
                        </div>
                    )}

                    <div>
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Building2 size={24} />
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {job.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                <MapPin size={12} /> {job.plantel.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                <Briefcase size={12} /> {job.type}
                            </span>
                        </div>

                        {job.closingDate && (
                            <div className="mb-4 flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                <Calendar size={12} />
                                Cierra el: {job.closingDate.toLocaleDateString()}
                            </div>
                        )}
                        
                        <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                            {job.description}
                        </p>
                    </div>

                    <Link 
                    href={`/apply/${job.id}`} 
                    className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all"
                    >
                    Ver detalles <ArrowRight size={16} />
                    </Link>
                </div>
               );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
