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
       // Logic fallthrough
    } else {
      redirect("/my-applications");
    }
  }

  const userId = session.user.id;
  let unreadCount = 0;
  let headerNotifications = [];

  try {
    const [unread, notifications] = await Promise.all([
      db.notification.count({ where: { userId, readAt: null } }),
      db.notification.findMany({
        where: { userId },
        include: {
          job: { include: { plantel: true, jobTitle: true } },
          application: true,
          plantel: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    unreadCount = unread;
    headerNotifications = notifications;
  } catch (error) {
    console.error("Dashboard layout load error", error);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <div className="sticky top-0 z-40">
        <DashboardHeader
          user={session.user}
          unreadCount={unreadCount}
          notifications={headerNotifications}
        />
      </div>
      <main className="flex-1 container mx-auto max-w-[1400px] p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}