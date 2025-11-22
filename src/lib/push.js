
import webpush from "web-push";
import { db } from "@/lib/db";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys are not configured. Push will be skipped.");
    return;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:desarrollo.tecnologico@casitaiedis.edu.mx",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
}

/**
 * Send a push notification payload to all subscriptions of a given user.
 * Payload example: { title, body, url }
 */
export async function sendUserPushNotifications(userId, payload) {
  ensureVapidConfigured();
  if (!vapidConfigured) return { success: false, reason: "vapid_not_configured" };

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    console.log("[push] Sending push", {
      userId,
      subCount: subscriptions.length,
    });

    if (subscriptions.length === 0) {
      return { success: true, sent: 0 };
    }

    const data = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                auth: sub.auth,
                p256dh: sub.p256dh,
              },
            },
            data
          );
          return { ok: true };
        } catch (err) {
          console.error("[push] send error", {
            endpoint: sub.endpoint,
            statusCode: err?.statusCode,
            message: err?.message,
          });

          // Clean up dead subscriptions
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await db.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    console.log("[push] Summary", { userId, sent, failed });

    return { success: true, sent, failed };
  } catch (error) {
    console.error("[push] Fatal error", error);
    return { success: false, error: error?.message || "unknown_error" };
  }
}
