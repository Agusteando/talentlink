
// --- src\app\dashboard\jobs\page.js ---
import { db } from "@/lib/db";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, AlertCircle, Tags } from "lucide-react";
import JobRow from "@/components/dashboard/jobs/JobRow";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function JobsManagementPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
      redirect("/dashboard");
  }

  const canManageCatalog = session.user.permissions?.includes(PERMISSIONS.MANAGE_CONFIG) || false;

  // 1:N FILTER
  let whereClause = {};
  
  if (!session.user.isGlobal) {
      const ids = session.user.plantelIds || [];
      if (ids.length > 0) {
          whereClause = { plantelId: { in: ids } };
      } else {
          whereClause = { id: "none" };
      }
  }

  const jobs = await db.job.findMany({
    where: whereClause,
    include: {
        plantel: true,
        _count: { select: { applications: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Gestión de Vacantes</h1>
                <p className="text-slate-500">Control de ofertas laborales activas e historial.</p>
            </div>
            <div className="flex items-center gap-2">
              {canManageCatalog && (
                <Link href="/dashboard/puestos" className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:border-purple-300 hover:text-purple-700 shadow-sm transition">
                  <Tags size={16} /> Catálogo de Puestos
                </Link>
              )}
              <Link href="/dashboard/jobs/new" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 shadow-lg transition-all">
                <PlusCircle size={18} /> Publicar Nueva Vacante
              </Link>
            </div>
       </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.length === 0 && (
                <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <AlertCircle size={48} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No hay vacantes registradas para tu vista.</p>
                </div>
            )}
            {jobs.map((job) => (
                <JobRow key={job.id} job={job} isAdmin={true} />
            ))}
       </div>
    </div>
  );
}
