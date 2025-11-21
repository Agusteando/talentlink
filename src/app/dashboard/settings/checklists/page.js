// --- src\app\dashboard\settings\checklists\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createChecklistItem, deleteChecklistItem, toggleChecklistItem } from '@/actions/checklist-actions';
import { Plus, Trash2, ToggleLeft, ToggleRight, ArrowLeft, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { PERMISSIONS } from '@/lib/permissions';

export default async function ChecklistsPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CONFIG)) {
      redirect('/dashboard');
  }

  const items = await db.checklistTemplate.findMany({ orderBy: { createdAt: 'asc' } });

  // UI MAPPING: Convert DB Enums to Spanish Labels
  const TYPE_LABELS = {
      TEXT: "Texto Libre",
      CHECKBOX: "Casilla de Verificación",
      DATE: "Selector de Fecha"
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/settings" className="p-2 rounded-full bg-white shadow border hover:bg-slate-100 transition"><ArrowLeft size={20}/></Link>
            <h1 className="text-2xl font-bold text-slate-800">Configurar Checklist</h1>
        </div>

        {/* CREATE FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="font-bold text-xs uppercase text-slate-500 mb-4 flex items-center gap-2"><Plus size={16}/> Agregar Nuevo Campo</h2>
            <form action={createChecklistItem} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400">Nombre del Campo</label>
                    <input name="name" placeholder="Ej. Signia ID, Examen Médico..." required className="w-full border p-2 rounded-lg text-sm font-medium"/>
                </div>
                <div className="w-1/3">
                    <label className="text-xs font-bold text-slate-400">Tipo de Dato</label>
                    <select name="type" className="w-full border p-2 rounded-lg text-sm bg-white">
                        <option value="TEXT">Texto (ID, Clave)</option>
                        <option value="CHECKBOX">Casilla (Si/No)</option>
                        <option value="DATE">Fecha</option>
                    </select>
                </div>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition">Agregar</button>
            </form>
        </div>

        {/* LIST */}
        <div className="space-y-3">
            {items.length === 0 && <p className="text-center text-slate-400 py-10">No hay elementos configurados.</p>}
            
            {items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ListChecks size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            {/* USE MAPPING HERE */}
                            <div className="text-xs text-slate-400">{TYPE_LABELS[item.type] || item.type}</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <form action={toggleChecklistItem.bind(null, item.id, item.isActive)}>
                            <button className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition ${item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {item.isActive ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                                {item.isActive ? 'Activo' : 'Inactivo'}
                            </button>
                        </form>
                        <form action={deleteChecklistItem.bind(null, item.id)}>
                            <button className="p-2 text-slate-300 hover:text-red-600 transition"><Trash2 size={16}/></button>
                        </form>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}