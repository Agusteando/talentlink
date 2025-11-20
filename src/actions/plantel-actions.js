// --- src\actions\plantel-actions.js ---
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createPlantel(formData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "No autorizado" };

    try {
        await db.plantel.create({
            data: {
                name: formData.get('name'),
                code: formData.get('code').toUpperCase(),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat') || 0),
                lng: parseFloat(formData.get('lng') || 0),
                isActive: formData.get('isActive') === 'true'
            }
        });
        revalidatePath('/dashboard/plantels');
        return { success: true, message: "Plantel creado correctamente" };
    } catch (e) {
        return { error: "Error: El código del plantel ya existe." };
    }
}

export async function updatePlantel(formData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "No autorizado" };

    try {
        await db.plantel.update({
            where: { id: formData.get('id') },
            data: {
                name: formData.get('name'),
                code: formData.get('code').toUpperCase(),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat') || 0),
                lng: parseFloat(formData.get('lng') || 0),
                isActive: formData.get('isActive') === 'true'
            }
        });
        revalidatePath('/dashboard/plantels');
        return { success: true, message: "Plantel actualizado" };
    } catch (e) {
        return { error: "Error al actualizar. Revisa los datos." };
    }
}

export async function deletePlantel(id) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "No autorizado" };

    try {
        // Safety Check: Don't delete if it has Jobs or Users
        const hasJobs = await db.job.count({ where: { plantelId: id } });
        const hasUsers = await db.user.count({ where: { plantelId: id } });

        if (hasJobs > 0 || hasUsers > 0) {
            return { error: `No se puede eliminar: Tiene ${hasJobs} vacantes y ${hasUsers} usuarios asignados.` };
        }

        await db.plantel.delete({ where: { id } });
        revalidatePath('/dashboard/plantels');
        return { success: true, message: "Plantel eliminado" };
    } catch (e) {
        return { error: "Error de base de datos al eliminar." };
    }
}