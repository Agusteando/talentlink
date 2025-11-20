// --- src/components/ui/Header.jsx ---
'use client';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Globe, LogIn, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
import { setCookie, getCookie } from 'cookies-next';
import { useEffect, useState } from 'react';

export default function Header() {
  const { data: session, status } = useSession();
  const [currentLang, setCurrentLang] = useState('ES');

  useEffect(() => {
    const cookie = getCookie('googtrans');
    if (cookie === '/es/en') setCurrentLang('EN');
    else setCurrentLang('ES');
  }, []);

  const toggleLanguage = () => {
    if (currentLang === 'ES') {
      setCookie('googtrans', '/es/en');
      setCurrentLang('EN');
    } else {
      setCookie('googtrans', '/es/es');
      setCurrentLang('ES');
    }
    window.location.reload();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // 1. Define Roles that can see the Panel
  const ADMIN_ROLES = ['ADMIN', 'RH', 'DIRECTOR'];
  const isAuthorized = session && ADMIN_ROLES.includes(session.user.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* BRAND */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <img src="https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png" alt="IECS-IEDIS" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
          <div className="hidden md:flex flex-col">
             <span className="font-extrabold text-slate-900 text-lg leading-none tracking-tight">Talent<span className="text-blue-600">Link</span></span>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reclutamiento</span>
          </div>
        </Link>

        {/* CONTROLS */}
        <div className="flex items-center gap-3">
          
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 border border-slate-200"
          >
            <Globe size={14} /> {currentLang}
          </button>

          {status === 'loading' ? (
             <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : session ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              
              {/* STRICT CHECK: Only render Panel link if authorized */}
              {isAuthorized && (
                <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    <LayoutDashboard size={14} /> <span className="hidden sm:inline">Panel</span>
                </Link>
              )}

              {/* Candidates see their portal */}
              {session.user.role === 'CANDIDATE' && (
                <Link href="/my-applications" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600">
                   <UserCircle size={18} /> <span className="hidden sm:inline">Mis Postulaciones</span>
                </Link>
              )}
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Cerrar Sesión"
              >
                  <LogOut size={18} />
              </button>
              
              {session.user.image && (
                 <img src={session.user.image} alt="User" className="h-8 w-8 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
          ) : (
            // OUTSIDERS SEE THIS ONLY
            <button 
              onClick={() => signIn("google")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:-translate-y-0.5"
            >
              <LogIn size={16} /> <span className="hidden sm:inline">Acceso Personal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}