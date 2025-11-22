
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/");

  if (!session.user.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD)) {
    redirect("/dashboard");
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
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
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  console.log("[NotificationsPage] Loaded", {
    email: session.user.email,
    count: notifications.length,
    unreadCount,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Centro de Notificaciones
            </h1>
            <p className="text-sm text-slate-500">
              Consulta alertas sobre nuevas postulaciones y cambios de estado
              relevantes para tus planteles.
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 border border-red-100">
              {unreadCount} sin leer
            </span>
          )}
        </div>

        <NotificationCenter initialNotifications={notifications} />
      </div>
    </div>
  );
}
