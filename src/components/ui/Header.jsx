// --- src\components\ui\Header.jsx ---
'use client';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { Globe, LogIn, LogOut, LayoutDashboard, Briefcase, UserCircle } from 'lucide-react';
import { handleSignOut } from '@/actions/auth-actions'; 
import { useRouter, useSearchParams } from 'next/navigation';

export default function Header({ lang = 'es' }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleLang = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    currentParams.set('lang', newLang);
    router.push(`/?${currentParams.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/?lang=${lang}`} className="flex items-center gap-3 group cursor-pointer">
          <img src="https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png" alt="IECS-IEDIS" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
          <div className="hidden md:flex flex-col">
             <span className="font-extrabold text-slate-900 text-lg leading-none tracking-tight">Talent<span className="text-blue-600">Link</span></span>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reclutamiento</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200">
            <Globe size={14} /> {lang === 'es' ? 'EN' : 'ES'}
          </button>

          {session ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              {session.user.role !== 'CANDIDATE' && (
                <>
                    <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        <LayoutDashboard size={14} /> Inicio
                    </Link>
                </>
              )}

              {session.user.role === 'CANDIDATE' && (
                <Link href="/my-applications" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600">
                   <UserCircle size={18} /> Mis Postulaciones
                </Link>
              )}
              
              <form action={handleSignOut}>
                  <button type="submit" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                      <LogOut size={18} />
                  </button>
              </form>
              
              {session.user.image && (
                 <img src={session.user.image} alt="User" className="h-8 w-8 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
          ) : (
            <button onClick={() => signIn("google")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:-translate-y-0.5">
              <LogIn size={16} /> {lang === 'es' ? 'Acceso Institucional' : 'Staff Login'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}