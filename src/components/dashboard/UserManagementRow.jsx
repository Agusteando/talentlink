// --- src\components\dashboard\UserManagementRow.jsx ---
'use client';
import { useState } from 'react';
import { updateUserPermissions } from '@/actions/user-actions';
import { Shield, Save, X, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserManagementRow({ user, plantels, roles }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId || '');
  const [selectedPlantelId, setSelectedPlantelId] = useState(user.plantelId || '');

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  // If role is NOT global, we show Plantel selector
  const showPlantelSelect = selectedRole && !selectedRole.isGlobal;

  const handleSave = async () => {
    try {
      const res = await updateUserPermissions(user.id, selectedRoleId, showPlantelSelect ? selectedPlantelId : null);
      if (res?.success) {
        toast.success("Usuario actualizado");
        setIsEditing(false);
      } else {
        toast.error("Error al actualizar");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                {user.image ? <img src={user.image} className="h-full w-full" /> : <span className="font-bold text-slate-400">{user.name?.[0]}</span>}
            </div>
            <div>
                <h3 className="font-bold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
                {!isEditing && (
                   <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {user.role?.name || 'Sin Rol'}
                      </span>
                      {user.plantel && (
                        <span className="flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-100">
                           <Building2 size={10} /> {user.plantel.name}
                        </span>
                      )}
                   </div>
                )}
            </div>
        </div>
        
        <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-slate-400 hover:text-blue-600 transition">
           {isEditing ? <X size={20} /> : <Shield size={20} />}
        </button>
      </div>

      {isEditing && (
        <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
           <div className="grid md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2">Rol del Sistema</label>
                 <select 
                    value={selectedRoleId} 
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm font-medium bg-white"
                 >
                    <option value="">-- Sin Acceso --</option>
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                 </select>
              </div>

              {showPlantelSelect && (
                 <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Asignar Plantel</label>
                    <select
                        value={selectedPlantelId}
                        onChange={(e) => setSelectedPlantelId(e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm font-medium bg-white"
                    >
                        <option value="">-- Seleccionar --</option>
                        {plantels.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                        ))}
                    </select>
                 </div>
              )}
           </div>

           <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                 <Save size={16} /> Guardar Permisos
              </button>
           </div>
        </div>
      )}
    </div>
  );
}