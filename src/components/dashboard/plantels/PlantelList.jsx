// --- src\components\dashboard\plantels\PlantelList.jsx ---
'use client';

import { useState } from 'react';
import { createPlantel, updatePlantel, deletePlantel } from '@/actions/plantel-actions';
import { Plus, Edit3, Trash2, MapPin, CheckCircle, XCircle, Building2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PlantelList({ initialData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlantel, setCurrentPlantel] = useState(null); // Null = Create Mode, Object = Edit Mode
  const [searchTerm, setSearchTerm] = useState('');

  // Client-side filter for instant feedback
  const filteredData = initialData.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setCurrentPlantel(null);
    setIsModalOpen(true);
  };

  const openEdit = (plantel) => {
    setCurrentPlantel(plantel);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este plantel? Esta acción no se puede deshacer.")) return;
    
    const res = await deletePlantel(id);
    if (res.success) toast.success(res.message);
    else toast.error(res.error);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <button 
            onClick={openCreate}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-slate-200"
         >
            <Plus size={18} /> Nuevo Plantel
         </button>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider font-semibold">
                <tr>
                    <th className="px-6 py-4">Plantel</th>
                    <th className="px-6 py-4">Ubicación</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Uso</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-10 text-center text-slate-400">No se encontraron resultados</td>
                    </tr>
                )}
                {filteredData.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                                    {p.code}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{p.name}</div>
                                    <div className="text-xs text-slate-400 font-mono">ID: {p.id.substring(0,8)}...</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                             <div className="truncate font-medium text-slate-600" title={p.address}>{p.address}</div>
                             <div className="text-[10px] text-slate-400 flex gap-2 mt-1">
                                <span>Lat: {p.lat || 'N/A'}</span>
                                <span>Lng: {p.lng || 'N/A'}</span>
                             </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {p.isActive ? (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100">
                                    <CheckCircle size={12} /> Activo
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200">
                                    <XCircle size={12} /> Inactivo
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex flex-col text-xs text-slate-500">
                                <span><b>{p._count.jobs}</b> Vacantes</span>
                                <span><b>{p._count.users}</b> Usuarios</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => openEdit(p)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Editar"
                                >
                                    <Edit3 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(p.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
         <PlantelModal 
            plantel={currentPlantel} 
            close={() => setIsModalOpen(false)} 
         />
      )}
    </>
  );
}

// --- INTERNAL MODAL COMPONENT ---
function PlantelModal({ plantel, close }) {
    const isEdit = !!plantel;

    async function handleSubmit(formData) {
        let res;
        if (isEdit) {
            res = await updatePlantel(formData);
        } else {
            res = await createPlantel(formData);
        }

        if (res.success) {
            toast.success(res.message);
            close();
        } else {
            toast.error(res.error);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">
                        {isEdit ? 'Editar Plantel' : 'Registrar Nuevo Plantel'}
                    </h3>
                    <button onClick={close} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition">
                        <XCircle size={20} />
                    </button>
                </div>
                
                <form action={handleSubmit} className="p-6 space-y-5">
                    {isEdit && <input type="hidden" name="id" value={plantel.id} />}
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre Amigable</label>
                            <input name="name" defaultValue={plantel?.name} placeholder="Ej. Campus Ecatepec" required className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Código</label>
                            <input name="code" defaultValue={plantel?.code} placeholder="ABC" maxLength={5} required className="w-full border border-slate-300 rounded-lg p-2.5 text-sm uppercase font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Dirección Completa</label>
                        <textarea name="address" defaultValue={plantel?.address} rows={2} placeholder="Calle, Número, Colonia, Ciudad..." required className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Latitud</label>
                            <input name="lat" type="number" step="any" defaultValue={plantel?.lat} placeholder="19.XXXX" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Longitud</label>
                            <input name="lng" type="number" step="any" defaultValue={plantel?.lng} placeholder="-99.XXXX" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <input type="checkbox" name="isActive" value="true" defaultChecked={isEdit ? plantel.isActive : true} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                         <label className="text-sm font-medium text-slate-700">Habilitar Plantel (Visible en Vacantes)</label>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={close} className="flex-1 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition text-sm">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg text-sm flex justify-center items-center gap-2">
                            <Building2 size={16} />
                            {isEdit ? 'Guardar Cambios' : 'Crear Plantel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}