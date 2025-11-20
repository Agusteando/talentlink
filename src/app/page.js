import { db } from "@/lib/db";
import Header from "@/components/ui/Header";
import Link from "next/link";
import { Search, MapPin, Briefcase, ArrowRight } from "lucide-react";

// This is a Server Component by default
export default async function Home({ searchParams }) {
  const query = searchParams?.q || "";
  const plantel = searchParams?.plantel || "";
  const lang = searchParams?.lang || "es"; // Simple query param for lang for now

  // Build the filter
  const whereClause = {
    status: "OPEN", // Only show open jobs
    ...(query && {
      title: { contains: query }, // Removed mode: 'insensitive' for MySQL compatibility in basic search
    }),
    ...(plantel && { plantel: plantel }),
  };

  const jobs = await db.job.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  const content = {
    es: {
      hero: "TalentLink: Conectando talento con oportunidad",
      subhero: "Únete a la comunidad educativa más innovadora. Busca tu próxima gran oportunidad en IECS-IEDIS.",
      searchPlaceholder: "Buscar puesto (ej. Docente, Admin)...",
      plantelPlaceholder: "Todos los Planteles",
      latest: "Vacantes Disponibles",
      noJobs: "No hay vacantes disponibles con estos criterios por el momento.",
      apply: "Ver Detalles y Aplicar",
      searchBtn: "Buscar",
    },
    en: {
      hero: "TalentLink: Connecting Talent with Opportunity",
      subhero: "Join the most innovative educational community. Find your next great opportunity at IECS-IEDIS.",
      searchPlaceholder: "Search job (e.g. Teacher, Admin)...",
      plantelPlaceholder: "All Campuses",
      latest: "Available Vacancies",
      noJobs: "No vacancies available matching your criteria at the moment.",
      apply: "View Details & Apply",
      searchBtn: "Search",
    },
  };

  const t = content[lang] || content.es;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Pass initialLang to Header. Note: In a real app, use a Context or Cookie for lang persistence */}
      <Header lang={lang} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-24 text-center text-white shadow-xl">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex justify-center">
             <span className="rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-bold text-blue-200 backdrop-blur-sm border border-blue-500/30">
                Reclutamiento 2025
             </span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl drop-shadow-lg">
            {t.hero}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100">
            {t.subhero}
          </p>
          
          {/* Search Form */}
          <form className="mx-auto max-w-4xl rounded-xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex flex-1 items-center px-4">
                <Search className="text-gray-400" />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={query}
                  placeholder={t.searchPlaceholder} 
                  className="w-full border-none p-3 text-gray-800 placeholder-gray-400 focus:ring-0 outline-none" 
                />
              </div>
              <div className="h-px bg-gray-200 md:h-auto md:w-px"></div>
              <div className="flex flex-1 items-center px-4">
                <MapPin className="text-gray-400" />
                <select 
                  name="plantel"
                  defaultValue={plantel}
                  className="w-full border-none bg-transparent p-3 text-gray-800 outline-none cursor-pointer"
                >
                  <option value="">{t.plantelPlaceholder}</option>
                  {['PM','PT','SM','ST','PREET','PREEM','ISM','IS','CT','CM','DM','CO'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {/* Hidden input to preserve lang if set */}
              <input type="hidden" name="lang" value={lang} />
              
              <button type="submit" className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-300">
                {t.searchBtn}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Job List */}
      <main className="container mx-auto py-16 px-4">
        <h2 className="mb-8 flex items-center gap-2 text-2xl font-bold text-slate-800">
          <Briefcase className="text-blue-600" /> {t.latest}
        </h2>
        
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
                <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-500">{t.noJobs}</p>
            <Link href="/" className="mt-4 text-blue-600 hover:underline">Limpiar filtros</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div>
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Briefcase size={24} />
                        </div>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {job.type}
                        </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">{job.department}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                            <MapPin size={12} /> {job.plantel}
                        </div>
                        <div className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 border border-green-100">
                            Abierto
                        </div>
                    </div>
                    
                    <p className="mt-4 line-clamp-3 text-sm text-slate-500">
                        {job.description}
                    </p>
                </div>

                <Link 
                  href={`/apply/${job.id}?lang=${lang}`} 
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 group-hover:shadow-lg"
                >
                  {t.apply} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}