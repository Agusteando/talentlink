// --- src\components\dashboard\DashboardHeader.jsx ---
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, LogOut, ExternalLink, CalendarDays, Columns, Settings, Menu, X, BarChart3 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { PERMISSIONS } from '@/lib/permissions';

export default function DashboardHeader({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (path) => pathname === path;
  const can = (p) => user.permissions?.includes(p);

  const navItems = [
    { href: '/dashboard', label: 'Lista', icon: LayoutDashboard, visible: can(PERMISSIONS.VIEW_DASHBOARD) },
    { href: '/dashboard/kanban', label: 'Tablero', icon: Columns, visible: can(PERMISSIONS.VIEW_CANDIDATES) },
    { href: '/dashboard/calendar', label: 'Agenda', icon: CalendarDays, visible: can(PERMISSIONS.VIEW_CANDIDATES) },
    { href: '/dashboard/analytics', label: 'Reportes', icon: BarChart3, visible: can(PERMISSIONS.VIEW_DASHBOARD) }, // NEW
    { href: '/dashboard/jobs', label: 'Vacantes', icon: Briefcase, visible: can(PERMISSIONS.MANAGE_JOBS) },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* MOBILE: Menu Button */}
        <button className="md:hidden p-2 text-slate-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
        </button>

        {/* BRAND */}
        <div className="flex items-center gap-2 select-none">
             <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">T</div>
             <span className="font-bold text-slate-800 hidden lg:block tracking-tight">TalentLink</span>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
                if (!item.visible) return null;
                const active = isActive(item.href);
                return (
                    <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-slate-100 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                        <item.icon size={16} /> {item.label}
                    </Link>
                );
            })}
        </nav>

        {/* USER CONTROLS */}
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block leading-tight">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase truncate max-w-[140px]">{user.roleName}</div>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            
            {(can(PERMISSIONS.MANAGE_CONFIG) || can(PERMISSIONS.MANAGE_USERS)) && (
                <Link href="/dashboard/settings" className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50" title="Configuración"><Settings size={18} /></Link>
            )}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><LogOut size={18} /></button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-5">
              {navItems.map((item) => {
                  if (!item.visible) return null;
                  return (
                      <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 text-slate-700 font-bold text-sm">
                          <item.icon size={18} /> {item.label}
                      </Link>
                  );
              })}
          </div>
      )}
    </header>
  );
}