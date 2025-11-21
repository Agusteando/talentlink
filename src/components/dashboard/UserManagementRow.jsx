// --- src\components\dashboard\UserManagementRow.jsx ---
'use client';
import { useState } from 'react';
import { updateUserPermissions } from '@/actions/user-actions';
import { Shield, Save, X, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserManagementRow({ user, plantels, roles }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId || '');
  
  // Initialize with existing IDs from the array
  const [selectedPlantelIds, setSelectedPlantelIds] = useState(
      user.plantels?.map(p => p.id) || []
  );

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const showPlantelSelect = selectedRole && !selectedRole.isGlobal;

  const handlePlantelToggle = (id) => {
      setSelectedPlantelIds(prev => 
          prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };

  const handleSave = async () => {
    try {
      const res = await updateUserPermissions(
          user.id, 
          selectedRoleId, 
          showPlantelSelect ? selectedPlantelIds : []
      );
      if (res?.success) {
        toast.success("Usuario actualizado");
        setIsEditing(false);
      } else {
        toast.error("Error al actualizar");
      }
    } catch (e) { toast.error("Error"); }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                {user.name?.[0]}
            </div>
            <div>
                <h3 className="font-bold text-slate-900">{user.name}</h3>
                <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 px-2 rounded font-bold text-slate-600">{user.role?.name || 'Sin Rol'}</span>
                    {user.plantels?.length > 0 && (
                        <span className="text-[10px] bg-yellow-50 px-2 rounded font-bold text-yellow-700 border border-yellow-100">
                            {user.plantels.length} Planteles
                        </span>
                    )}
                </div>
            </div>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-blue-600"><Shield size={18}/></button>
      </div>

      {isEditing && (
        <div className="pt-4 border-t border-slate-100 grid md:grid-cols-2 gap-6">
           <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Rol</label>
              <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full p-2 border rounded text-sm">
                 <option value="">-- Sin Acceso --</option>
                 {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
           </div>

           {showPlantelSelect && (
              <div>
                 <label className="block text-xs font-bold text-slate-400 mb-2">Planteles Asignados</label>
                 <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                     {plantels.map(p => (
                         <label key={p.id} className="flex items-center gap-2 text-sm p-1 hover:bg-slate-50 rounded cursor-pointer">
                             <input 
                                type="checkbox" 
                                checked={selectedPlantelIds.includes(p.id)} 
                                onChange={() => handlePlantelToggle(p.id)}
                                className="rounded text-blue-600"
                             />
                             {p.name}
                         </label>
                     ))}
                 </div>
              </div>
           )}

           <div className="md:col-span-2 flex justify-end">
              <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                 <Save size={16} /> Guardar
              </button>
           </div>
        </div>
      )}
    </div>
  );
}