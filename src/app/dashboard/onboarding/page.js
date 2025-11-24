
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserOnboardingForm from "@/components/dashboard/UserOnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/");

  const plantelIds = session.user.plantelIds || [];
  const isGlobal = !!session.user.isGlobal;

  // Si ya tiene planteles o es global, no necesita onboarding
  if (isGlobal || plantelIds.length > 0) {
    redirect("/dashboard");
  }

  const plantels = await db.plantel.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  console.log("[OnboardingPage] Loaded", {
    email: session.user.email,
    plantelCount: plantels.length,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-white p-2 shadow-sm hover:bg-slate-100 border border-slate-200 transition"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bienvenido a TalentLink
            </h1>
            <p className="text-sm text-slate-500">
              Antes de comenzar, indica en qué plantel(es) trabajas para
              personalizar tu experiencia y tus notificaciones.
            </p>
          </div>
        </div>

        <UserOnboardingForm plantels={plantels} />
      </div>
    </div>
  );
}
