'use client';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Globe, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { setCookie, getCookie } from 'cookies-next';
import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@/lib/permissions';

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

  const canViewDashboard = status === 'authenticated' && (
    session?.user?.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD) ||
    session?.user?.roleName === 'Super Admin' ||
    session?.user?.isGlobal
  );

  return (
    <header className="fixed top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 py-12">
        {/* LOGO AREA */}
        <Link href="/" className="flex items-center gap-4 group cursor-pointer">
          {/* Institution Logo */}
          <img 
            src="https://casitaiedis.edu.mx/img/IMAGOTIPO-IECS-IEDIS-23.png" 
            alt="IECS-IEDIS" 
            className="h-20 w-auto object-contain opacity-90 transition-opacity group-hover:opacity-100" 
          />
          
          {/* Divider */}
          <div className="h-6 w-px bg-slate-300/50"></div>
          
          {/* New App Logo */}
          <img 
            src="/TalentLink.png" 
            alt="TalentLink" 
            className="h-20 w-auto object-contain" 
          />
        </Link>

        {/* ACTIONS AREA */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-50 px-4 py-4 text-xs font-bold text-slate-600 transition hover:bg-white hover:shadow-md border border-slate-200/60"
          >
            <Globe size={14} /> {currentLang}
          </button>

          {status === 'loading' ? (
            <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-full"></div>
          ) : status === 'authenticated' ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200/60">
              {canViewDashboard && (
                <Link href="/dashboard" className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm transition-all">
                  <LayoutDashboard size={14} /> <span className="hidden sm:inline">Panel</span>
                </Link>
              )}
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
              {session?.user?.image && (
                <img src={session.user.image} alt="User" className="h-9 w-9 rounded-full border-2 border-white shadow-md" />
              )}
            </div>
          ) : (
            <button 
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-blue-700 hover:-translate-y-0.5"
            >
              <LogIn size={16} /> <span className="hidden sm:inline">Acceso Staff</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}