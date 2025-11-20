'use server' // <--- THIS IS MANDATORY
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateUserRole(formData) {
    const session = await auth();
    
    // Security Check
    if (!session || session.user.role !== 'ADMIN') {
        console.log("Unauthorized role update attempt");
        return;
    }

    const userId = formData.get('userId');
    const role = formData.get('role');
    const plantel = formData.get('plantel');

    try {
        await db.user.update({
            where: { id: userId },
            data: { 
                role, 
                plantel: role === 'DIRECTOR' ? plantel : null 
            }
        });
        revalidatePath('/dashboard/users');
    } catch (error) {
        console.error("Error updating user:", error);
    }
}