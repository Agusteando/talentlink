// --- src\app\dashboard\settings\page.js ---
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Tags, ListChecks, Users, ArrowRight } from 'lucide-react';

export default async function SettingsHub() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const settingsOptions = [
    { 
        title: "Planteles & Sedes", 
        desc: "Administra las ubicaciones físicas, direcciones y coordenadas de los campus.", 
        icon: Building2, 
        href: "/dashboard/plantels",
        color: "bg-blue-50 text-blue-600"
    },
    { 
        title: "Catálogo de Puestos", 
        desc: "Define los títulos de trabajo estandarizados (Docente, Intendente, etc.)", 
        icon: Tags, 
        href: "/dashboard/puestos",
        color: "bg-purple-50 text-purple-600"
    },
    { 
        title: "Checklist Dinámico", 
        desc: "Configura los campos de seguimiento (IDs, Documentos) requeridos para candidatos.", 
        icon: ListChecks, 
        href: "/dashboard/settings/checklists", // NEW
        color: "bg-emerald-50 text-emerald-600"
    },
    { 
        title: "Usuarios y Permisos", 
        desc: "Gestiona directores de plantel, personal de RH y administradores.", 
        icon: Users, 
        href: "/dashboard/users",
        color: "bg-amber-50 text-amber-600"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración del Sistema</h1>
            <p className="text-slate-500 mb-8">Panel central de administración de catálogos y reglas de negocio.</p>

            <div className="grid md:grid-cols-2 gap-6">
                {settingsOptions.map((opt) => (
                    <Link key={opt.href} href={opt.href} className="group">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${opt.color}`}>
                                    <opt.icon size={24} />
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition">{opt.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{opt.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    </div>
  );
}