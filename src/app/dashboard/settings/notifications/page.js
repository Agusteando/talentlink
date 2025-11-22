
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import NotificationSettingsPanel from "@/components/dashboard/settings/NotificationSettingsPanel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  if (!session.user.permissions?.includes(PERMISSIONS.VIEW_DASHBOARD)) {
    redirect("/dashboard");
  }

  let plantelWhere = { isActive: true };
  if (!session.user.isGlobal) {
    plantelWhere.id = { in: session.user.plantelIds || [] };
  }

  const [plantels, jobTitles, prefs] = await Promise.all([
    db.plantel.findMany({
      where: plantelWhere,
      orderBy: { name: "asc" },
    }),
    db.jobTitle.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.notificationPreference.findMany({
      where: { userId: session.user.id },
      include: { plantel: true, jobTitle: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  console.log("[NotificationSettingsPage] Loaded", {
    email: session.user.email,
    plantelCount: plantels.length,
    jobTitleCount: jobTitles.length,
    prefCount: prefs.length,
    hasVapidKey: !!vapidPublicKey,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="rounded-full bg-white p-2.5 shadow-sm hover:bg-slate-100 transition border border-slate-200"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notificaciones personales
            </h1>
            <p className="text-sm text-slate-500">
              Configura cómo y desde qué planteles o puestos deseas recibir
              avisos (panel, correo y notificaciones push).
            </p>
          </div>
        </div>

        <NotificationSettingsPanel
          initialPrefs={prefs}
          plantels={plantels}
          jobTitles={jobTitles}
          vapidPublicKey={vapidPublicKey}
        />
      </div>
    </div>
  );
}
