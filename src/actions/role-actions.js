// --- src\actions\role-actions.js ---
'use server';
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

async function checkAuth() {
    const session = await auth();
    // Must have MANAGE_ROLES permission
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_ROLES)) {
        throw new Error("No autorizado");
    }
    return session;
}

export async function createRole(data) {
    try {
        await checkAuth();
        await db.role.create({
            data: {
                name: data.name,
                isGlobal: data.isGlobal,
                permissions: data.permissions // Already JSON string
            }
        });
        revalidatePath('/dashboard/settings/roles');
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

export async function updateRole(data) {
    try {
        await checkAuth();
        await db.role.update({
            where: { id: data.id },
            data: {
                name: data.name,
                isGlobal: data.isGlobal,
                permissions: data.permissions
            }
        });
        revalidatePath('/dashboard/settings/roles');
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

export async function deleteRole(id) {
    try {
        await checkAuth();
        // Check usage
        const count = await db.user.count({ where: { roleId: id } });
        if (count > 0) return { error: "No se puede eliminar: Hay usuarios asignados a este rol." };

        await db.role.delete({ where: { id } });
        revalidatePath('/dashboard/settings/roles');
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}