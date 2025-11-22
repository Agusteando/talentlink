
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";

function hasConfigPermission(session) {
  return session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CONFIG);
}

function hasCandidateManagePermission(session) {
  return session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES);
}

// ADMIN/CONFIG: Manage Templates
export async function createChecklistItem(formData) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Checklist] create item invoked", {
    email: session?.user?.email,
    allowed,
  });

  if (!allowed) return { error: "No autorizado" };

  try {
    const agg = await db.checklistTemplate.aggregate({
      _max: { sortOrder: true },
    });
    const nextOrder = (agg._max.sortOrder ?? 0) + 1;

    await db.checklistTemplate.create({
      data: {
        name: (formData.get("name") || "").toString().trim(),
        type: (formData.get("type") || "TEXT").toString().trim(),
        isActive: true,
        sortOrder: nextOrder,
      },
    });

    revalidatePath("/dashboard/settings/checklists");
    return { success: true };
  } catch (e) {
    console.error("[Checklist] create error:", e);
    return { error: "Error al crear el campo." };
  }
}

export async function deleteChecklistItem(id) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Checklist] delete item invoked", {
    email: session?.user?.email,
    allowed,
    id,
  });

  if (!allowed) return { error: "No autorizado" };

  try {
    await db.checklistTemplate.delete({ where: { id } });
    revalidatePath("/dashboard/settings/checklists");
    return { success: true };
  } catch (e) {
    console.error("[Checklist] delete error:", e);
    return { error: "No se pudo eliminar el campo." };
  }
}

export async function toggleChecklistItem(id, currentStatus) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Checklist] toggle item invoked", {
    email: session?.user?.email,
    allowed,
    id,
    currentStatus,
  });

  if (!allowed) return { error: "No autorizado" };

  try {
    await db.checklistTemplate.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/dashboard/settings/checklists");
    return { success: true };
  } catch (e) {
    console.error("[Checklist] toggle error:", e);
    return { error: "No se pudo actualizar el estado." };
  }
}

export async function reorderChecklistItems(orderedIds) {
  const session = await auth();
  const allowed = hasConfigPermission(session);
  console.log("[Checklist] reorder invoked", {
    email: session?.user?.email,
    allowed,
    orderedCount: Array.isArray(orderedIds) ? orderedIds.length : 0,
  });

  if (!allowed) return { error: "No autorizado" };
  if (!Array.isArray(orderedIds)) return { error: "Datos inválidos" };

  try {
    const ops = orderedIds.map((id, idx) =>
      db.checklistTemplate.update({
        where: { id },
        data: { sortOrder: idx },
      })
    );
    await db.$transaction(ops);
    revalidatePath("/dashboard/settings/checklists");
    return { success: true };
  } catch (e) {
    console.error("[Checklist] reorder error:", e);
    return { error: "No se pudo guardar el orden." };
  }
}

// RECRUITER: Save Values
export async function saveChecklistValues(applicationId, valuesObj) {
  const session = await auth();
  const allowed = hasCandidateManagePermission(session);
  console.log("[Checklist] save values invoked", {
    email: session?.user?.email,
    allowed,
    applicationId,
  });

  if (!allowed) return { error: "No autorizado" };

  try {
    const operations = Object.entries(valuesObj).map(
      ([templateId, value]) => {
        return db.checklistValue.upsert({
          where: {
            applicationId_templateId: { applicationId, templateId },
          },
          update: { value: value?.toString?.() ?? "" },
          create: { applicationId, templateId, value: value?.toString?.() ?? "" },
        });
      }
    );

    await db.$transaction(operations);
    revalidatePath(`/dashboard/application/${applicationId}`);
    return { success: true };
  } catch (e) {
    console.error("[Checklist] save values error:", e);
    return { error: "Error de base de datos" };
  }
}
