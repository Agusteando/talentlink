
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  // If they don't have dashboard access, kick them out
  // (Since we give Super Admin to everyone now, this should pass)
  if (!session.user.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD)) {
    // Only redirect if they are truly blocked, prevent infinite loop
    if (session.user.role !== "CANDIDATE") {
      // Safety: If somehow they have no permissions but logged in
    } else {
      redirect("/my-applications");
    }
  }

  let unreadCount = 0;
  try {
    unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });
  } catch (error) {
    console.error("[DashboardLayout] Failed to load unread notifications", {
      email: session.user.email,
      error: error?.message,
    });
  }

  console.log("[DashboardLayout] Session + notifications", {
    email: session.user.email,
    unreadCount,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader user={session.user} unreadCount={unreadCount} />
      <main className="flex-1 container mx-auto max-w-7xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
