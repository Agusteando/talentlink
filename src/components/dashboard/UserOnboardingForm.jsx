
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyPlantels } from "@/actions/user-actions";
import { Building2, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UserOnboardingForm({ plantels }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const togglePlantel = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("Selecciona al menos un plantel.");
      return;
    }

    setLoading(true);
    const res = await updateMyPlantels(selectedIds);
    setLoading(false);

    if (res?.success) {
      toast.success("Planteles guardados");
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error(res?.error || "Error al guardar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {plantels.length === 0 && (
          <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No hay planteles activos configurados. Contacta al administrador.
          </div>
        )}

        {plantels.map((p) => {
          const active = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlantel(p.id)}
              className={`flex h-full w-full flex-col items-stretch rounded-xl border p-4 text-left transition shadow-sm ${
                active
                  ? "border-blue-500 bg-blue-50/60"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${
                    active
                      ? "border-blue-500 bg-blue-100 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {p.code}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    {active && (
                      <CheckCircle2
                        size={16}
                        className="text-blue-600 shrink-0"
                      />
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    {p.address}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Podrás actualizar estos datos más adelante desde{" "}
        <span className="font-semibold">Configuración &gt; Notificaciones personales</span>.
      </p>

      <button
        type="submit"
        disabled={loading || selectedIds.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-600 transition disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <span>Comenzar</span>
        )}
      </button>
    </form>
  );
}
