// --- src\actions\user-actions.js ---
'use server';
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateUserPermissions(userId, role, plantelId) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await db.user.update({
            where: { id: userId },
            data: { 
                role: role, 
                // Use the relational ID now
                plantelId: role === 'DIRECTOR' ? plantelId : null 
            }
        });
        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error) {
        console.error("Update User Error:", error);
        return { success: false, error: "Database error" };
    }
}