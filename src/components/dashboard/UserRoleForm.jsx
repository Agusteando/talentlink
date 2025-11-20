'use client';
import { updateUserRole } from '@/actions/user-actions';
import { Shield } from 'lucide-react';

export default function UserRoleForm({ user }) {
  return (
    <form action={updateUserRole} className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3">
        <input type="hidden" name="userId" value={user.id} />
        
        <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Rol</label>
            <select 
                name="role" 
                defaultValue={user.role} 
                className="block w-32 rounded border-gray-200 bg-white text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-0"
            >
                <option value="CANDIDATE">Candidato</option>
                <option value="RH">Recursos Humanos</option>
                <option value="DIRECTOR">Director Plantel</option>
                <option value="ADMIN">Administrador</option>
            </select>
        </div>

        <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Plantel (Dir)</label>
            <select 
                name="plantel" 
                defaultValue={user.plantel || ''} 
                className="block w-32 rounded border-gray-200 bg-white text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-0"
            >
                <option value="">- N/A -</option>
                {['PM','PT','SM','ST','PREET','PREEM','ISM','IS','CT','CM','DM','CO'].map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>
        </div>

        <button type="submit" className="mb-[2px] rounded bg-blue-600 p-2 text-white hover:bg-blue-700 shadow-sm transition-all">
            <Shield size={16} />
        </button>
    </form>
  );
}