"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, LogOut, CalendarDays, Columns, Settings, Menu, X, BarChart3, Bell
} from "lucide-react";
import { signOut } from "next-auth/react";
import { PERMISSIONS } from "@/lib/permissions";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export default function DashboardHeader({ user, unreadCount = 0, notifications = [] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(unreadCount);
  const pathname = usePathname();
  const isActive = (path) => pathname === path;
  const can = (p) => user.permissions?.includes(p);

  useEffect(() => { setBadgeCount(unreadCount); }, [unreadCount]);

  const navItems = [
    { href: "/dashboard", label: "Lista", icon: LayoutDashboard, visible: can(PERMISSIONS.VIEW_DASHBOARD) },
    { href: "/dashboard/kanban", label: "Tablero", icon: Columns, visible: can(PERMISSIONS.VIEW_CANDIDATES) },
    { href: "/dashboard/calendar", label: "Agenda", icon: CalendarDays, visible: can(PERMISSIONS.VIEW_CANDIDATES) },
    { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3, visible: can(PERMISSIONS.VIEW_DASHBOARD) },
    { href: "/dashboard/jobs", label: "Vacantes", icon: Briefcase, visible: can(PERMISSIONS.MANAGE_JOBS) },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 shadow-sm transition-all">
      <div className="container mx-auto max-w-[1400px] px-6 h-20 flex items-center justify-between py-12">
        {/* MOBILE */}
        <button className="md:hidden p-2 text-slate-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>

        {/* BRAND */}
        <Link href="/dashboard" className="flex items-center gap-3 select-none">
           {/* Replaced CSS Icon with PNG */}
           <img src="/TalentLink.png" alt="TalentLink" className="h-20 w-auto object-contain" />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-full border border-slate-200/50">
          {navItems.map((item) => {
            if (!item.visible) return null;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  active
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          {can(PERMISSIONS.VIEW_DASHBOARD) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition"
              >
                <Bell size={18} />
                {badgeCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
            </div>
          )}

          <div className="text-right hidden sm:block leading-tight">
            <div className="text-sm font-bold text-slate-900">{user.name}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
              {user.roleName}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          {(can(PERMISSIONS.MANAGE_CONFIG) || can(PERMISSIONS.MANAGE_USERS)) && (
            <Link href="/dashboard/settings" className="p-2.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Configuración">
              <Settings size={20} />
            </Link>
          )}
          <button onClick={() => signOut({ callbackUrl: "/" })} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {isNotifOpen && (
        <div className="absolute right-4 top-20 w-full max-w-md animate-in slide-in-from-top-2 z-50">
          <NotificationCenter initialNotifications={notifications} />
        </div>
      )}
    </header>
  );
}