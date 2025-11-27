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

  if (session?.user) {
    const canView = session.user.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD) 
      || session.user.roleName === 'Super Admin' 
      || session.user.isGlobal;
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
    <div className="min-h-screen">
      <Header />
      
      {/* --- HERO SECTION --- */}
      <div className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        {/* Abstract curve background */}
        <div className="absolute top-0 left-0 right-0 h-[80%] bg-gradient-to-b from-blue-50/80 to-transparent -z-10 rounded-b-[3rem] lg:rounded-b-[5rem]"></div>
        
        {/* Dotted pattern overlay */}
        <div className="absolute inset-0 bg-educational opacity-50 -z-20"></div>

        <div className="container relative mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Reclutamiento 2025 Activo</span>
          </div>

          <h1 className="font-outfit mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl mb-6 leading-[1.1]">
            Descubre tu futuro en <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-emerald-600">IECS-IEDIS</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed">
            Forma parte de una institución líder. Conectamos talento con oportunidades académicas y administrativas en un entorno de crecimiento.
          </p>
          
          {/* SEARCH BAR */}
          <form className="mx-auto max-w-4xl relative z-20">
            <div className="flex flex-col md:flex-row gap-2 p-3 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100">
              <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-2xl md:bg-transparent">
                <Search className="text-blue-500" size={22} />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={query}
                  placeholder="¿Qué puesto buscas? (Ej. Docente, Coordinador)" 
                  className="w-full p-4 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium" 
                />
              </div>
              
              <div className="hidden md:block w-px h-10 bg-slate-200 self-center"></div>

              <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-2xl md:bg-transparent mt-2 md:mt-0">
                <MapPin className="text-emerald-500" size={22} />
                <select 
                  name="plantel"
                  defaultValue={plantelId}
                  className="w-full p-4 bg-transparent border-none outline-none text-slate-800 cursor-pointer font-medium appearance-none"
                >
                  <option value="">Todas las ubicaciones</option>
                  {plantels.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="bg-gradient-to-r from-blue-700 to-emerald-600 hover:from-blue-800 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2 md:mt-0">
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- JOBS GRID --- */}
      <main className="container mx-auto pb-24 px-6 relative z-10 -mt-10">
        <div className="flex items-end justify-between mb-8 px-2">
            <div>
                <h2 className="font-outfit text-3xl font-bold text-slate-900">
                    Oportunidades Recientes
                </h2>
                <p className="text-slate-500 mt-1">Explora las vacantes disponibles hoy.</p>
            </div>
            <span className="hidden md:block text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                {jobs.length} vacantes activas
            </span>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-slate-200 border-dashed">
             <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} className="text-slate-300" />
             </div>
             <p className="text-xl font-medium text-slate-600">No se encontraron vacantes con estos criterios.</p>
             <Link href="/" className="text-blue-600 font-bold mt-4 inline-block hover:underline">Ver todas las ofertas</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
               const isNew = isJobNew(job.createdAt);
               return (
                <div key={job.id} className="group relative flex flex-col justify-between bg-white p-7 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-200/40 hover:-translate-y-1 transition-all duration-300">
                    {isNew && (
                        <div className="absolute top-6 right-6 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                            <Sparkles size={10} /> NUEVO
                        </div>
                    )}

                    <div>
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                            <Building2 size={26} />
                        </div>
                        
                        <h3 className="font-outfit text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors leading-tight">
                            {job.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                <MapPin size={12} className="text-slate-400" /> {job.plantel.name}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <Briefcase size={12} /> {job.type}
                            </span>
                        </div>
                        
                        <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                            {job.description}
                        </p>
                    </div>

                    <div className="mt-auto">
                        <div className="w-full h-px bg-slate-100 mb-4"></div>
                        <div className="flex items-center justify-between">
                            {job.closingDate ? (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    <Calendar size={12} />
                                    <span>Cierra: {job.closingDate.toLocaleDateString()}</span>
                                </div>
                            ) : <span></span>}

                            <Link 
                                href={`/apply/${job.id}`} 
                                className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-emerald-600 transition-colors"
                            >
                                Ver detalles <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
               );
            })}
          </div>
        )}
      </main>
    </div>
  );
}