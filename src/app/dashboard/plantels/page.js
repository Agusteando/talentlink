// --- src\app\dashboard\plantels\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createPlantel, updatePlantel } from '@/actions/plantel-actions';
import { MapPin, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function PlantelsPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const plantels = await db.plantel.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard" className="rounded-full bg-white p-2 shadow hover:bg-slate-100">
                <ArrowLeft size={20} className="text-slate-600"/>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Planteles</h1>
        </div>
        
        {/* Add Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="font-bold text-sm uppercase text-slate-500 mb-4 flex items-center gap-2">
                <Plus size={16}/> Agregar Nuevo Plantel
            </h2>
            <form action={createPlantel} className="grid md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Amigable</label>
                    <input name="name" placeholder="Ej. Campus Ecatepec" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Código</label>
                    <input name="code" placeholder="Ej. PREET" required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Completa</label>
                    <input name="address" placeholder="Av. Central #123, Col. Valle..." required className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Latitud</label>
                    <input name="lat" type="number" step="any" placeholder="19.XXXX" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Longitud</label>
                    <input name="lng" type="number" step="any" placeholder="-99.XXXX" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <button className="bg-slate-900 text-white p-2.5 rounded text-sm font-bold hover:bg-blue-600 transition w-full flex items-center justify-center gap-2">
                    <Save size={14} /> Guardar
                </button>
            </form>
        </div>

        {/* List */}
        <div className="space-y-4">
            {plantels.length === 0 && (
                <div className="text-center py-10 text-slate-400">No hay planteles registrados.</div>
            )}
            {plantels.map(p => (
                <form key={p.id} action={updatePlantel} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <input type="hidden" name="id" value={p.id} />
                    <div className="flex-1 grid md:grid-cols-3 gap-4 w-full">
                        <div>
                             <label className="text-[10px] font-bold text-slate-400 block">Nombre</label>
                             <input name="name" defaultValue={p.name} className="w-full font-bold text-slate-800 border-b border-transparent focus:border-blue-500 outline-none text-sm" />
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-400 block">Dirección ({p.code})</label>
                             <input name="address" defaultValue={p.address} className="w-full text-sm text-slate-600 border-b border-transparent focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block">Lat</label>
                                <input name="lat" defaultValue={p.lat} className="w-full text-xs border rounded p-1 bg-slate-50" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block">Lng</label>
                                <input name="lng" defaultValue={p.lng} className="w-full text-xs border rounded p-1 bg-slate-50" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block">Estado</label>
                                <select name="isActive" defaultValue={p.isActive} className="w-full text-xs border rounded p-1 bg-white">
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button className="text-xs bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition">Actualizar</button>
                </form>
            ))}
        </div>
      </div>
    </div>
  );
}