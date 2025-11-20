'use client';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { Globe, LogIn, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
import { handleSignOut } from '@/actions/auth-actions'; // Use the server action we created
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/?lang=${lang}`} className="flex items-center gap-3">
          {/* Using the logo URL provided */}
          <img src="https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png" alt="IECS-IEDIS" className="h-10 w-auto object-contain" />
          <span className="hidden font-bold tracking-tight text-slate-800 md:block text-lg">
            Talent<span className="text-blue-600">Link</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
          >
            <Globe size={14} /> {lang === 'es' ? 'EN' : 'ES'}
          </button>

          {session ? (
            <div className="flex items-center gap-4">
              {session.user.role !== 'CANDIDATE' ? (
                <Link href="/dashboard" className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              ) : (
                <Link href="/my-applications" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600">
                   <UserCircle size={18} /> Mis Postulaciones
                </Link>
              )}
              
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                {session.user.image && (
                   <img src={session.user.image} alt="User" className="h-8 w-8 rounded-full border border-slate-200" />
                )}
                <form action={handleSignOut}>
                    <button type="submit" className="text-slate-400 hover:text-red-500 transition">
                        <LogOut size={18} />
                    </button>
                </form>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => signIn("google")}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
            >
              <LogIn size={16} /> {lang === 'es' ? 'Acceso Institucional' : 'Login'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}