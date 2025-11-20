// --- src\app\dashboard\plantels\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createPlantel, updatePlantel } from '@/actions/plantel-actions';
import { MapPin, Plus } from 'lucide-react';

export default async function PlantelsPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const plantels = await db.plantel.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Gestión de Planteles</h1>
        
        {/* Add Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="font-bold text-sm uppercase text-slate-500 mb-4 flex items-center gap-2"><Plus size={16}/> Agregar Nuevo</h2>
            <form action={createPlantel} className="grid md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold">Nombre Amigable</label>
                    <input name="name" placeholder="Ej. Campus Central" required className="w-full border p-2 rounded text-sm"/>
                </div>
                <div>
                    <label className="text-xs font-bold">Código</label>
                    <input name="code" placeholder="Ej. CEN" required className="w-full border p-2 rounded text-sm"/>
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold">Dirección</label>
                    <input name="address" placeholder="Calle, Col, CP..." required className="w-full border p-2 rounded text-sm"/>
                </div>
                <div>
                    <label className="text-xs font-bold">Latitud</label>
                    <input name="lat" type="number" step="any" placeholder="19.4326" className="w-full border p-2 rounded text-sm"/>
                </div>
                <div>
                    <label className="text-xs font-bold">Longitud</label>
                    <input name="lng" type="number" step="any" placeholder="-99.1332" className="w-full border p-2 rounded text-sm"/>
                </div>
                <button className="bg-slate-900 text-white p-2 rounded text-sm font-bold">Guardar</button>
            </form>
        </div>

        {/* List */}
        <div className="grid gap-4">
            {plantels.map(p => (
                <form key={p.id} action={updatePlantel} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <input type="hidden" name="id" value={p.id} />
                    <div className="flex-1 grid md:grid-cols-3 gap-4 w-full">
                        <input name="name" defaultValue={p.name} className="font-bold text-slate-800 border-b border-transparent focus:border-blue-500 outline-none" />
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                             <span className="bg-slate-100 px-2 py-1 rounded font-mono">{p.code}</span>
                             <input name="address" defaultValue={p.address} className="flex-1 border-b border-transparent focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <input name="lat" defaultValue={p.lat} placeholder="Lat" className="w-20 text-xs border rounded p-1" />
                            <input name="lng" defaultValue={p.lng} placeholder="Lng" className="w-20 text-xs border rounded p-1" />
                        </div>
                    </div>
                    <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-100">Actualizar</button>
                </form>
            ))}
        </div>
      </div>
    </div>
  );
}