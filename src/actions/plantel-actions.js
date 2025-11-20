// --- src\actions\plantel-actions.js ---
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createPlantel(formData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        await db.plantel.create({
            data: {
                name: formData.get('name'),
                code: formData.get('code').toUpperCase(),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat') || 0),
                lng: parseFloat(formData.get('lng') || 0),
                isActive: true
            }
        });
        revalidatePath('/dashboard/plantels');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Error creando plantel. Revisa si el código ya existe." };
    }
}

export async function updatePlantel(formData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        await db.plantel.update({
            where: { id: formData.get('id') },
            data: {
                name: formData.get('name'),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat') || 0),
                lng: parseFloat(formData.get('lng') || 0),
                isActive: formData.get('isActive') === 'true'
            }
        });
        revalidatePath('/dashboard/plantels');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Error actualizando plantel" };
    }
}