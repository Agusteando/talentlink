
"use client";

import { useEffect, useState, useTransition } from "react";
import { saveNotificationPreferences } from "@/actions/notification-actions";
import {
  Bell,
  Wifi,
  Mail,
  Monitor,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

function normalizePrefRow(p) {
  return {
    id: p.id || undefined,
    plantelId: p.plantelId || "",
    jobTitleId: p.jobTitleId || "",
    emailNewEntries: p.emailNewEntries ?? true,
    emailStatusUpdates: p.emailStatusUpdates ?? true,
    inAppNewEntries: p.inAppNewEntries ?? true,
    inAppStatusUpdates: p.inAppStatusUpdates ?? true,
    pushNewEntries: p.pushNewEntries ?? false,
    pushStatusUpdates: p.pushStatusUpdates ?? false,
  };
}

function base64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSettingsPanel({
  initialPrefs,
  plantels,
  jobTitles,
  vapidPublicKey,
}) {
  const [rows, setRows] = useState(
    (initialPrefs || []).map((p) =>
      normalizePrefRow({
        ...p,
        plantelId: p.plantelId || "",
        jobTitleId: p.jobTitleId || "",
      })
    )
  );
  const [isSaving, startSaving] = useTransition();
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    // Try to detect existing subscription for label purposes
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setPushEnabled(!!sub);
      })
      .catch(() => {
        setPushEnabled(false);
      });
  }, []);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: undefined,
        plantelId: "",
        jobTitleId: "",
        emailNewEntries: true,
        emailStatusUpdates: true,
        inAppNewEntries: true,
        inAppStatusUpdates: true,
        pushNewEntries: false,
        pushStatusUpdates: false,
      },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index, patch) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const handleSave = () => {
    startSaving(async () => {
      const payload = rows.map((r) => ({
        ...r,
        plantelId: r.plantelId || null,
        jobTitleId: r.jobTitleId || null,
      }));
      const res = await saveNotificationPreferences(payload);
      if (res?.success) {
        toast.success("Preferencias actualizadas");
      } else {
        toast.error(res?.error || "Error al guardar");
      }
    });
  };

  const handleRegisterPush = async () => {
    if (!vapidPublicKey) {
      toast.error("Falta configurar las llaves VAPID en el servidor.");
      return;
    }

    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Este navegador no soporta notificaciones push.");
      return;
    }

    try {
      setIsRegisteringPush(true);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permiso de notificaciones denegado.");
        setIsRegisteringPush(false);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setPushEnabled(true);
        toast.success("Notificaciones push activadas para este navegador.");
        setIsRegisteringPush(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) {
        throw new Error("Error registrando suscripción.");
      }

      setPushEnabled(true);
      toast.success("Notificaciones push activadas para este navegador.");
    } catch (error) {
      console.error("[NotificationSettings] push register error", error);
      toast.error("No se pudo activar push en este navegador.");
    } finally {
      setIsRegisteringPush(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Push registration banner */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
            <Wifi size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Activar notificaciones push
            </p>
            <p className="text-xs text-slate-500">
              Recibe alertas en tiempo real en este navegador cuando se
              registren nuevas postulaciones o cambie el estado de un candidato.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRegisterPush}
          disabled={isRegisteringPush}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-70"
        >
          {isRegisteringPush ? (
            <Loader2 size={14} className="animate-spin" />
          ) : pushEnabled ? (
            <CheckCircle2 size={14} />
          ) : (
            <Wifi size={14} />
          )}
          {pushEnabled ? "Push activado" : "Activar en este navegador"}
        </button>
      </div>

      {/* Preferences table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Reglas de notificación
              </p>
              <p className="text-xs text-slate-400">
                Crea reglas por plantel y/o puesto. La coincidencia exacta
                tiene prioridad sobre reglas globales.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={14} /> Nueva regla
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Plantel</th>
                <th className="px-3 py-2 text-left">Puesto</th>
                <th className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Mail size={12} /> Nuevas
                  </div>
                </th>
                <th className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Mail size={12} /> Estatus
                  </div>
                </th>
                <th className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Monitor size={12} /> Nuevas
                  </div>
                </th>
                <th className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Monitor size={12} /> Estatus
                  </div>
                </th>
                <th className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Wifi size={12} /> Nuevas
                  </div>
                </th>
                <th className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <Wifi size={12} /> Estatus
                  </div>
                </th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Aún no tienes reglas configuradas. Agrega al menos una
                    regla global o por plantel.
                  </td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/40">
                  <td className="px-3 py-2 min-w-[160px]">
                    <select
                      value={row.plantelId}
                      onChange={(e) =>
                        updateRow(index, { plantelId: e.target.value })
                      }
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="">Todos los planteles</option>
                      {plantels.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 min-w-[180px]">
                    <select
                      value={row.jobTitleId}
                      onChange={(e) =>
                        updateRow(index, { jobTitleId: e.target.value })
                      }
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="">Todos los puestos</option>
                      {jobTitles.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Email new */}
                  <td className="px-3 py-2 text-center">
                    <TogglePill
                      active={row.emailNewEntries}
                      onClick={() =>
                        updateRow(index, {
                          emailNewEntries: !row.emailNewEntries,
                        })
                      }
                    />
                  </td>
                  {/* Email status */}
                  <td className="px-3 py-2 text-center">
                    <TogglePill
                      active={row.emailStatusUpdates}
                      onClick={() =>
                        updateRow(index, {
                          emailStatusUpdates: !row.emailStatusUpdates,
                        })
                      }
                    />
                  </td>
                  {/* In-app new */}
                  <td className="px-3 py-2 text-center">
                    <TogglePill
                      active={row.inAppNewEntries}
                      onClick={() =>
                        updateRow(index, {
                          inAppNewEntries: !row.inAppNewEntries,
                        })
                      }
                    />
                  </td>
                  {/* In-app status */}
                  <td className="px-3 py-2 text-center">
                    <TogglePill
                      active={row.inAppStatusUpdates}
                      onClick={() =>
                        updateRow(index, {
                          inAppStatusUpdates: !row.inAppStatusUpdates,
                        })
                      }
                    />
                  </td>
                  {/* Push new */}
                  <td className="px-3 py-2 text-center">
                    <TogglePill
                      active={row.pushNewEntries}
                      onClick={() =>
                        updateRow(index, {
                          pushNewEntries: !row.pushNewEntries,
                        })
                      }
                    />
                  </td>
                  {/* Push status */}
                  <td className="px-3 py-2 text-center">
                    <TogglePill
                      active={row.pushStatusUpdates}
                      onClick={() =>
                        updateRow(index, {
                          pushStatusUpdates: !row.pushStatusUpdates,
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                      title="Eliminar regla"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[11px] text-slate-400">
            Si una postulación coincide con varias reglas, se aplicará primero
            la combinación más específica (plantel + puesto), luego sólo
            plantel/puesto y finalmente la regla global.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-70"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
}

function TogglePill({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
    </button>
  );
}
