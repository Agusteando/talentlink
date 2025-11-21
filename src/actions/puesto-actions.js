// --- src\actions\puesto-actions.js ---
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createPuesto(formData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        await db.jobTitle.create({
            data: {
                name: formData.get('name'),
                category: formData.get('category'),
                isActive: true
            }
        });
        revalidatePath('/dashboard/puestos');
        return { success: true };
    } catch (e) {
        return { error: "El puesto ya existe." };
    }
}

export async function togglePuestoStatus(id, currentStatus) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };

    await db.jobTitle.update({
        where: { id },
        data: { isActive: !currentStatus }
    });
    revalidatePath('/dashboard/puestos');
    return { success: true };
}

export async function deletePuesto(id) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        await db.jobTitle.delete({ where: { id } });
        revalidatePath('/dashboard/puestos');
        return { success: true };
    } catch (e) {
        return { error: "No se puede eliminar, está en uso por vacantes." };
    }
}