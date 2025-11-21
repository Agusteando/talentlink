// --- src\components\dashboard\settings\RoleEditor.jsx ---
'use client';
import { useState } from 'react';
import { Plus, Edit3, Trash2, Check, X, Globe, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RoleEditor({ roles, permissions, createAction, updateAction, deleteAction }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        isGlobal: false,
        selectedPerms: []
    });

    const openCreate = () => {
        setEditingRole(null);
        setFormData({ name: '', isGlobal: false, selectedPerms: [] });
        setIsModalOpen(true);
    };

    const openEdit = (role) => {
        setEditingRole(role);
        let parsedPerms = [];
        try { parsedPerms = JSON.parse(role.permissions); } catch(e) {}
        
        setFormData({
            name: role.name,
            isGlobal: role.isGlobal,
            selectedPerms: parsedPerms
        });
        setIsModalOpen(true);
    };

    const handleTogglePerm = (permId) => {
        setFormData(prev => {
            const exists = prev.selectedPerms.includes(permId);
            return {
                ...prev,
                selectedPerms: exists 
                    ? prev.selectedPerms.filter(p => p !== permId)
                    : [...prev.selectedPerms, permId]
            };
        });
    };

    const handleSubmit = async () => {
        if(!formData.name) return toast.error("El nombre es obligatorio");

        const payload = {
            id: editingRole?.id,
            name: formData.name,
            isGlobal: formData.isGlobal,
            permissions: JSON.stringify(formData.selectedPerms)
        };

        const res = editingRole 
            ? await updateAction(payload)
            : await createAction(payload);

        if (res.success) {
            toast.success("Rol guardado correctamente");
            setIsModalOpen(false);
        } else {
            toast.error(res.error || "Error al guardar");
        }
    };

    const handleDelete = async (id) => {
        if(!confirm("¿Eliminar este rol? Los usuarios asignados perderán acceso.")) return;
        const res = await deleteAction(id);
        if(res.success) toast.success("Rol eliminado");
        else toast.error(res.error);
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* CREATE CARD */}
                <button onClick={openCreate} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group h-full">
                    <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-blue-200 text-slate-400 group-hover:text-blue-600 flex items-center justify-center mb-3">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-slate-500 group-hover:text-blue-700">Crear Nuevo Rol</span>
                </button>

                {/* ROLE CARDS */}
                {roles.map(role => (
                    <div key={role.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-800">{role.name}</h3>
                                {role.isGlobal ? (
                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                        <Globe size={10}/> Global
                                    </span>
                                ) : (
                                    <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                        <MapPin size={10}/> Local
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mb-4">
                                {role._count.users} usuarios asignados
                            </p>
                        </div>
                        
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <button onClick={() => openEdit(role)} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-2 rounded-lg transition">
                                <Edit3 size={14} /> Editar
                            </button>
                            {role.name !== 'Super Admin' && (
                                <button onClick={() => handleDelete(role.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700"/></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Rol</label>
                                    <input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full border p-2 rounded-lg text-sm font-medium"
                                        placeholder="Ej. Reclutador"
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.isGlobal}
                                            onChange={e => setFormData({...formData, isGlobal: e.target.checked})}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="text-sm">
                                            <span className="block font-bold text-slate-700">Acceso Global</span>
                                            <span className="text-xs text-slate-500">Ve todos los planteles</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Permissions Grid */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Permisos Asignados</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {permissions.map(perm => (
                                        <label key={perm.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${formData.selectedPerms.includes(perm.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.selectedPerms.includes(perm.id)}
                                                onChange={() => handleTogglePerm(perm.id)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className={`text-sm font-medium ${formData.selectedPerms.includes(perm.id) ? 'text-blue-800' : 'text-slate-600'}`}>
                                                {perm.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancelar</button>
                            <button onClick={handleSubmit} className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-blue-600 transition shadow-lg">Guardar Rol</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}