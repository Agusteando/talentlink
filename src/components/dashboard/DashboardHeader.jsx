// --- src\components\dashboard\DashboardHeader.jsx ---
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Users, MapPin, LogOut, ExternalLink } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function DashboardHeader({ user }) {
  const pathname = usePathname();

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

  const navItems = [
    { href: '/dashboard', label: 'Candidatos', icon: LayoutDashboard, roles: ['ADMIN', 'RH', 'DIRECTOR'] },
    { href: '/dashboard/jobs', label: 'Vacantes', icon: Briefcase, roles: ['ADMIN', 'DIRECTOR'] },
    { href: '/dashboard/plantels', label: 'Planteles', icon: MapPin, roles: ['ADMIN'] },
    { href: '/dashboard/users', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
                 <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">T</div>
                 <span className="font-bold text-slate-800 hidden md:block">TalentLink <span className="text-slate-400 font-normal">| Panel</span></span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                    if (!item.roles.includes(user.role)) return null;
                    const active = isActive(item.href);
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                ${active ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>

        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] text-slate-500 uppercase">{user.role} • {user.plantelName || 'Global'}</div>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <Link href="/" target="_blank" className="p-2 text-slate-400 hover:text-blue-600 transition" title="Ver Sitio Público">
                <ExternalLink size={18} />
            </Link>
            
            <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Cerrar Sesión"
            >
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </header>
  );
}