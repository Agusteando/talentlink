// --- src\app\dashboard\settings\checklists\page.js ---
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  createChecklistItem,
} from "@/actions/checklist-actions";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PERMISSIONS } from "@/lib/permissions";
import ChecklistList from "@/components/dashboard/settings/ChecklistList";

export default async function ChecklistsPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CONFIG)) {
    redirect("/dashboard");
  }

  const items = await db.checklistTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // UI MAPPING: Convert DB Enums to Spanish Labels
  const TYPE_LABELS = {
    TEXT: "Texto Libre",
    CHECKBOX: "Casilla de Verificación",
    DATE: "Selector de Fecha",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/settings"
            className="p-2 rounded-full bg-white shadow border hover:bg-slate-100 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            Configurar Checklist
          </h1>
        </div>

        {/* CREATE FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-bold text-xs uppercase text-slate-500 mb-4 flex items-center gap-2">
            <Plus size={16} /> Agregar Nuevo Campo
          </h2>
          <form
            action={createChecklistItem}
            className="flex flex-col md:flex-row gap-4 items-end"
          >
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400">
                Nombre del Campo
              </label>
              <input
                name="name"
                placeholder="Ej. Signia ID, Examen Médico..."
                required
                className="w-full border p-2 rounded-lg text-sm font-medium"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-xs font-bold text-slate-400">
                Tipo de Dato
              </label>
              <select
                name="type"
                className="w-full border p-2 rounded-lg text-sm bg-white"
              >
                <option value="TEXT">Texto (ID, Clave)</option>
                <option value="CHECKBOX">Casilla (Si/No)</option>
                <option value="DATE">Fecha</option>
              </select>
            </div>
            <button className="w-full md:w-auto bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition">
              Agregar
            </button>
          </form>
        </div>

        {/* LIST WITH DRAG & DROP */}
        <ChecklistList items={items} typeLabels={TYPE_LABELS} />
      </div>
    </div>
  );
}