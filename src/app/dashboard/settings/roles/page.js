// --- src\app\dashboard\settings\roles\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PERMISSIONS } from '@/lib/permissions';
import { createRole, updateRole, deleteRole } from '@/actions/role-actions';
import RoleEditor from '@/components/dashboard/settings/RoleEditor';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function RolesPage() {
  const session = await auth();
  // Guard: Only users with MANAGE_ROLES permission
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_ROLES)) {
      redirect('/dashboard');
  }

  const roles = await db.role.findMany({ 
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } }
  });

  // Pass permissions structure to client
  const availablePermissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
      key: value, // The value string "jobs:manage" is what we store
      label: key  // The readable key e.g. MANAGE_JOBS (Can be mapped to Spanish text)
  }));

  // Map friendly Spanish names
  const friendlyNames = {
    [PERMISSIONS.VIEW_DASHBOARD]: "Acceso al Panel",
    [PERMISSIONS.MANAGE_JOBS]: "Gestionar Vacantes",
    [PERMISSIONS.VIEW_CANDIDATES]: "Ver Candidatos",
    [PERMISSIONS.MANAGE_CANDIDATES]: "Gestionar Candidatos (Mover/Entrevistar)",
    [PERMISSIONS.MANAGE_USERS]: "Gestionar Usuarios",
    [PERMISSIONS.MANAGE_ROLES]: "Gestionar Roles y Permisos",
    [PERMISSIONS.MANAGE_CONFIG]: "Configuración (Planteles/Puestos/Checklist)"
  };

  const uiPermissions = availablePermissions.map(p => ({
      id: p.key,
      name: friendlyNames[p.key] || p.key
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/settings" className="p-2 rounded-full bg-white shadow border hover:bg-slate-100 transition"><ArrowLeft size={20}/></Link>
            <h1 className="text-2xl font-bold text-slate-800">Roles y Permisos</h1>
        </div>
        
        <p className="text-slate-500 mb-8">
            Crea perfiles de acceso personalizados. Define si el rol es global (toda la organización) o limitado al plantel asignado al usuario.
        </p>

        <RoleEditor 
            roles={roles} 
            permissions={uiPermissions} 
            createAction={createRole}
            updateAction={updateRole}
            deleteAction={deleteRole}
        />
      </div>
    </div>
  );
}