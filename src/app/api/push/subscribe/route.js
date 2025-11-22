
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request, context) {
  const params = await context.params; // required by project conventions (unused here)
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { endpoint, keys, expirationTime } = body || {};

    console.log("[PushSubscribe] Incoming", {
      email: session.user.email,
      hasEndpoint: !!endpoint,
      hasKeys: !!keys,
      expirationTime,
    });

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return new Response("Invalid subscription", { status: 400 });
    }

    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get("user-agent") || null,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PushSubscribe] Error", error);
    return new Response("Server error", { status: 500 });
  }
}
