
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_NOTIFICATION_CHANNELS,
  normalizeNotificationChannels,
} from "@/lib/notification-preferences";

export async function saveNotificationPreferences(preferences) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const userId = session.user.id;
  const incoming = Array.isArray(preferences) ? preferences : [];

  console.log("[NotificationPrefs] save invoked", {
    email: session.user.email,
    incomingCount: incoming.length,
  });

  try {
    const existing = await db.notificationPreference.findMany({
      where: { userId },
    });

    const existingById = new Map(existing.map((p) => [p.id, p]));

    const normalizedIncoming = incoming.map((p) => {
      const channels = normalizeNotificationChannels(p);
      return {
        id: p.id || undefined,
        plantelId: p.plantelId || null,
        jobTitleId: p.jobTitleId || null,
        ...channels,
      };
    });

    const incomingIds = new Set(
      normalizedIncoming.filter((p) => p.id).map((p) => p.id)
    );

    const toDeleteIds = existing
      .filter((e) => !incomingIds.has(e.id))
      .map((e) => e.id);

    const ops = [];

    if (toDeleteIds.length > 0) {
      ops.push(
        db.notificationPreference.deleteMany({
          where: { id: { in: toDeleteIds }, userId },
        })
      );
    }

    for (const pref of normalizedIncoming) {
      if (pref.id && existingById.has(pref.id)) {
        ops.push(
          db.notificationPreference.update({
            where: { id: pref.id },
            data: {
              plantelId: pref.plantelId,
              jobTitleId: pref.jobTitleId,
              emailNewEntries: pref.emailNewEntries,
              emailStatusUpdates: pref.emailStatusUpdates,
              inAppNewEntries: pref.inAppNewEntries,
              inAppStatusUpdates: pref.inAppStatusUpdates,
              pushNewEntries: pref.pushNewEntries,
              pushStatusUpdates: pref.pushStatusUpdates,
            },
          })
        );
      } else {
        ops.push(
          db.notificationPreference.create({
            data: {
              userId,
              plantelId: pref.plantelId,
              jobTitleId: pref.jobTitleId,
              emailNewEntries: pref.emailNewEntries,
              emailStatusUpdates: pref.emailStatusUpdates,
              inAppNewEntries: pref.inAppNewEntries,
              inAppStatusUpdates: pref.inAppStatusUpdates,
              pushNewEntries: pref.pushNewEntries,
              pushStatusUpdates: pref.pushStatusUpdates,
            },
          })
        );
      }
    }

    if (ops.length > 0) {
      await db.$transaction(ops);
    }

    revalidatePath("/dashboard/settings/notifications");

    return { success: true };
  } catch (error) {
    console.error("[NotificationPrefs] save error", error);
    return { error: "Error al guardar preferencias" };
  }
}

export async function markNotificationRead(notificationId) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  console.log("[Notification] mark read", {
    userId: session.user.id,
    notificationId,
  });

  try {
    const res = await db.notification.updateMany({
      where: { id: notificationId, userId: session.user.id },
      data: { readAt: new Date() },
    });

    revalidatePath("/dashboard/notifications");

    return { success: true, updated: res.count };
  } catch (error) {
    console.error("[Notification] mark read error", error);
    return { error: "Error al marcar como leído" };
  }
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  console.log("[Notification] mark all read", {
    userId: session.user.id,
  });

  try {
    const res = await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    revalidatePath("/dashboard/notifications");

    return { success: true, updated: res.count };
  } catch (error) {
    console.error("[Notification] mark all read error", error);
    return { error: "Error al marcar notificaciones" };
  }
}
