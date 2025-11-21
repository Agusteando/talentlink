
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";

function hasConfigPermission(session) {
  return session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CONFIG);
}

export async function createPuesto(formData) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Puestos] createPuesto invoked", { email: session?.user?.email, allowed });

  if (!allowed) {
    console.warn("[Puestos] Unauthorized create attempt", { email: session?.user?.email });
    return { error: "No autorizado" };
  }

  try {
    await db.jobTitle.create({
      data: {
        name: (formData.get('name') || '').toString().trim(),
        category: (formData.get('category') || '').toString().trim(),
        isActive: true
      }
    });
    revalidatePath('/dashboard/puestos');
    return { success: true };
  } catch (e) {
    console.error("[Puestos] create error:", e?.message);
    return { error: "El puesto ya existe o ocurrió un error." };
  }
}

export async function togglePuestoStatus(id, currentStatus) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Puestos] togglePuestoStatus invoked", { email: session?.user?.email, allowed, id, currentStatus });

  if (!allowed) {
    console.warn("[Puestos] Unauthorized toggle attempt", { email: session?.user?.email });
    return { error: "No autorizado" };
  }

  try {
    await db.jobTitle.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/dashboard/puestos');
    return { success: true };
  } catch (e) {
    console.error("[Puestos] toggle error:", e?.message);
    return { error: "Error al actualizar el estado." };
  }
}

export async function deletePuesto(id) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Puestos] deletePuesto invoked", { email: session?.user?.email, allowed, id });

  if (!allowed) {
    console.warn("[Puestos] Unauthorized delete attempt", { email: session?.user?.email });
    return { error: "No autorizado" };
  }

  try {
    await db.jobTitle.delete({ where: { id } });
    revalidatePath('/dashboard/puestos');
    return { success: true };
  } catch (e) {
    console.error("[Puestos] delete error:", e?.message);
    return { error: "No se puede eliminar, está en uso por vacantes." };
  }
}
