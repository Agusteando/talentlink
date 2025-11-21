// --- src\actions\user-actions.js ---
'use server';
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";

export async function updateUserPermissions(userId, roleId, plantelIds) {
    const session = await auth();
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_USERS)) {
        return { success: false, error: "No autorizado." };
    }

    try {
        // Update Role and Plantels (Set logic replaces existing relations)
        await db.user.update({
            where: { id: userId },
            data: { 
                roleId: roleId || null,
                plantels: {
                    set: [], // Clear existing
                    connect: plantelIds.map(id => ({ id })) // Connect new ones
                }
            }
        });

        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error de base de datos" };
    }
}