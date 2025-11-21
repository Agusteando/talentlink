import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createPuesto, togglePuestoStatus, deletePuesto } from '@/actions/puesto-actions';
import { Plus, Tag, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PERMISSIONS } from '@/lib/permissions';

export default async function PuestosPage() {
  const session = await auth();
  
  // PERMISSION CHECK: Must have config access
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CONFIG)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
            <p className="text-slate-500 mb-6">No tienes permisos para gestionar el catálogo de puestos.</p>
            <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
                Volver al Panel
            </Link>
        </div>
      );
  }

  const puestos = await db.jobTitle.findMany({ 
      orderBy: { name: 'asc' }, 
      include: { _count: { select: { jobs: true } } } 
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/settings" className="p-2 rounded-full bg-white shadow border hover:bg-slate-100 transition"><ArrowLeft size={20}/></Link>
            <h1 className="text-2xl font-bold text-slate-800">Catálogo de Puestos</h1>
        </div>
        
        {/* ADD FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="font-bold text-xs uppercase text-slate-500 mb-4 flex items-center gap-2"><Plus size={16}/> Registrar Nuevo Puesto</h2>
            <form action={createPuesto} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400">Nombre del Puesto</label>
                    <input name="name" placeholder="Ej. Docente Matemáticas" required className="w-full border p-2 rounded-lg text-sm font-medium"/>
                </div>
                <div className="w-1/3">
                    <label className="text-xs font-bold text-slate-400">Categoría</label>
                    <select name="category" className="w-full border p-2 rounded-lg text-sm bg-white">
                        <option value="Academico">Académico</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Intendencia">Intendencia / Mantenimiento</option>
                        <option value="Directivo">Directivo</option>
                    </select>
                </div>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition">Guardar</button>
            </form>
        </div>

        {/* LIST */}
        <div className="grid gap-3">
            {puestos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Tag size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-xs text-slate-500 flex gap-2">
                                <span className="bg-slate-100 px-2 rounded">{p.category}</span>
                                <span>{p._count.jobs} vacantes activas</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <form action={togglePuestoStatus.bind(null, p.id, p.isActive)}>
                            <button className={`text-[10px] font-bold px-2 py-1 rounded border ${p.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {p.isActive ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                        </form>
                        
                        {p._count.jobs === 0 && (
                             <form action={deletePuesto.bind(null, p.id)}>
                                <button className="p-2 text-slate-300 hover:text-red-600 transition"><Trash2 size={16}/></button>
                             </form>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}