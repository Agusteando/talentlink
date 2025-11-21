
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";

function hasConfigPermission(session) {
  return session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CONFIG);
}

export async function createPlantel(formData) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Planteles] create invoked", { email: session?.user?.email, allowed });

  if (!allowed) return { error: "No autorizado" };

  try {
    await db.plantel.create({
      data: {
        name: (formData.get('name') || '').toString().trim(),
        code: (formData.get('code') || '').toString().trim().toUpperCase(),
        address: (formData.get('address') || '').toString().trim(),
        lat: parseFloat(formData.get('lat') || 0),
        lng: parseFloat(formData.get('lng') || 0),
        isActive: formData.get('isActive') === 'true'
      }
    });
    revalidatePath('/dashboard/plantels');
    return { success: true, message: "Plantel creado correctamente" };
  } catch (e) {
    console.error("[Planteles] create error:", e?.message);
    return { error: "Error: El código del plantel ya existe." };
  }
}

export async function updatePlantel(formData) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Planteles] update invoked", { email: session?.user?.email, allowed, id: formData.get('id') });

  if (!allowed) return { error: "No autorizado" };

  try {
    await db.plantel.update({
      where: { id: formData.get('id') },
      data: {
        name: (formData.get('name') || '').toString().trim(),
        code: (formData.get('code') || '').toString().trim().toUpperCase(),
        address: (formData.get('address') || '').toString().trim(),
        lat: parseFloat(formData.get('lat') || 0),
        lng: parseFloat(formData.get('lng') || 0),
        isActive: formData.get('isActive') === 'true'
      }
    });
    revalidatePath('/dashboard/plantels');
    return { success: true, message: "Plantel actualizado" };
  } catch (e) {
    console.error("[Planteles] update error:", e?.message);
    return { error: "Error al actualizar. Revisa los datos." };
  }
}

export async function deletePlantel(id) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Planteles] delete invoked", { email: session?.user?.email, allowed, id });

  if (!allowed) return { error: "No autorizado" };

  try {
    const hasJobs = await db.job.count({ where: { plantelId: id } });
    const hasUsers = await db.user.count({ where: { plantels: { some: { id } } } });

    if (hasJobs > 0 || hasUsers > 0) {
      return { error: `No se puede eliminar: Tiene ${hasJobs} vacantes y ${hasUsers} usuarios asignados.` };
    }

    await db.plantel.delete({ where: { id } });
    revalidatePath('/dashboard/plantels');
    return { success: true, message: "Plantel eliminado" };
  } catch (e) {
    console.error("[Planteles] delete error:", e?.message);
    return { error: "Error de base de datos al eliminar." };
  }
}
