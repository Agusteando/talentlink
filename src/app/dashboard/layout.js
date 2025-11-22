
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db";
import { DEFAULT_NOTIFICATION_CHANNELS } from "@/lib/notification-preferences";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  if (!session.user.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD)) {
    if (session.user.role !== "CANDIDATE") {
      // Usuario logueado sin permisos claros, lo dejamos caer al dashboard base
    } else {
      redirect("/my-applications");
    }
  }

  const userId = session.user.id;
  let unreadCount = 0;
  let headerNotifications = [];

  try {
    const [unread, notifications, prefCount] = await Promise.all([
      db.notification.count({
        where: { userId, readAt: null },
      }),
      db.notification.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              plantel: true,
              jobTitle: true,
            },
          },
          application: true,
          plantel: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.notificationPreference.count({
        where: { userId },
      }),
    ]);

    unreadCount = unread;
    headerNotifications = notifications;

    // Bootstrap de preferencias por primera vez según alcance del usuario
    if (prefCount === 0) {
      const isGlobal = !!session.user.isGlobal;
      const plantelIds = session.user.plantelIds || [];
      const baseChannels = DEFAULT_NOTIFICATION_CHANNELS;

      const ops = [];

      if (isGlobal) {
        // Rol global: una sola regla general (todos los planteles / todos los puestos)
        ops.push(
          db.notificationPreference.create({
            data: {
              userId,
              plantelId: null,
              jobTitleId: null,
              ...baseChannels,
            },
          })
        );
      } else if (plantelIds.length > 0) {
        // Roles locales: una regla por cada plantel asignado (todos los puestos)
        for (const plantelId of plantelIds) {
          ops.push(
            db.notificationPreference.create({
              data: {
                userId,
                plantelId,
                jobTitleId: null,
                ...baseChannels,
              },
            })
          );
        }
      } else {
        // Fallback: sin plantel asignado, aplicar regla global
        ops.push(
          db.notificationPreference.create({
            data: {
              userId,
              plantelId: null,
              jobTitleId: null,
              ...baseChannels,
            },
          })
        );
      }

      if (ops.length > 0) {
        await db.$transaction(ops);
        console.log("[DashboardLayout] Bootstrapped notification prefs", {
          email: session.user.email,
          createdRules: ops.length,
          isGlobal,
          plantelIdsCount: plantelIds.length,
        });
      }
    }

    console.log("[DashboardLayout] Session + notifications", {
      email: session.user.email,
      unreadCount,
      headerNotifs: headerNotifications.length,
    });
  } catch (error) {
    console.error("[DashboardLayout] Notification preload error", {
      email: session.user.email,
      error: error?.message,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        user={session.user}
        unreadCount={unreadCount}
        notifications={headerNotifications}
      />
      <main className="flex-1 container mx-auto max-w-7xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
