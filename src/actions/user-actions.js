'use server';
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";

export async function updateUserPermissions(userId, roleId, plantelId) {
    const session = await auth();
    
    // 1. Security Check: Must have permission to manage users
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_USERS)) {
        return { success: false, error: "No tienes permisos para gestionar usuarios." };
    }

    try {
        // 2. Verify Role Validity (Optional but safe)
        if (roleId) {
            const roleExists = await db.role.findUnique({ where: { id: roleId } });
            if (!roleExists) return { success: false, error: "Rol inválido" };
        }

        // 3. Update User
        await db.user.update({
            where: { id: userId },
            data: { 
                roleId: roleId || null, // Link to the Role Table
                plantelId: plantelId || null // Link to Plantel (if applicable)
            }
        });

        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error) {
        console.error("Update User Error:", error);
        return { success: false, error: "Error de base de datos" };
    }
}