
"use server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";

export async function updateUserPermissions(userId, roleId, plantelIds) {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_USERS)) {
    return { success: false, error: "No autorizado." };
  }

  try {
    // Update Role and Plantels (Set logic replaces existing relations)
    await db.user.update({
      where: { id: userId },
      data: {
        roleId: roleId || null,
        plantels: {
          set: [], // Clear existing
          connect: plantelIds.map((id) => ({ id })), // Connect new ones
        },
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error de base de datos" };
  }
}

export async function updateMyPlantels(plantelIds) {
  const session = await auth();
  const userId = session?.user?.id;

  console.log("[User] updateMyPlantels invoked", {
    email: session?.user?.email,
    userId,
    plantelCount: Array.isArray(plantelIds) ? plantelIds.length : 0,
  });

  if (!userId) {
    return { success: false, error: "No autorizado." };
  }

  const safeIds = Array.isArray(plantelIds)
    ? plantelIds.filter((id) => typeof id === "string" && id.length > 0)
    : [];

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        plantels: {
          set: [],
          connect: safeIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings/notifications");

    return { success: true };
  } catch (error) {
    console.error("[User] updateMyPlantels error", error);
    return { success: false, error: "Error de base de datos" };
  }
}
