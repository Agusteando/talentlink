'use server'
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateUserRole(formData) {
    const session = await auth();
    // Only ADMIN can change roles
    if (!session || session.user.role !== 'ADMIN') return;

    const userId = formData.get('userId');
    const role = formData.get('role');
    const plantel = formData.get('plantel');

    await db.user.update({
        where: { id: userId },
        data: { 
            role, 
            plantel: role === 'DIRECTOR' ? plantel : null 
        }
    });
    revalidatePath('/dashboard/users');
}