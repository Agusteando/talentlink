
"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
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

  // --- Quick summary & global toggles ---

  const ruleCount = rows.length;
  const hasGlobalRule = rows.some(
    (r) => !r.plantelId && !r.jobTitleId
  );

  let scopeLabel = "";
  if (ruleCount === 0) {
    scopeLabel =
      "Aún no tienes reglas definidas. Se aplicará el comportamiento por defecto de TalentLink.";
  } else if (hasGlobalRule) {
    scopeLabel = "Todos tus planteles y todos los puestos.";
  } else if (ruleCount === 1) {
    const r = rows[0];
    const plantelText = r.plantelId
      ? plantels.find((p) => p.id === r.plantelId)?.name || "Plantel específico"
      : "Todos los planteles";
    const jobText = r.jobTitleId
      ? jobTitles.find((t) => t.id === r.jobTitleId)?.name || "Puesto específico"
      : "Todos los puestos";
    scopeLabel = `${plantelText} • ${jobText}`;
  } else {
    scopeLabel = "Varias reglas por plantel y/o puesto (modo avanzado).";
  }

  const allEmailOn =
    ruleCount > 0 &&
    rows.every((r) => r.emailNewEntries && r.emailStatusUpdates);
  const allPanelOn =
    ruleCount > 0 &&
    rows.every((r) => r.inAppNewEntries && r.inAppStatusUpdates);
  const allPushOn =
    ruleCount > 0 &&
    rows.every((r) => r.pushNewEntries && r.pushStatusUpdates);

  const toggleAllEmail = () => {
    const next = !allEmailOn;
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        emailNewEntries: next,
        emailStatusUpdates: next,
      }))
    );
  };

  const toggleAllPanel = () => {
    const next = !allPanelOn;
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        inAppNewEntries: next,
        inAppStatusUpdates: next,
      }))
    );
  };

  const toggleAllPush = () => {
    const next = !allPushOn;
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        pushNewEntries: next,
        pushStatusUpdates: next,
      }))
    );
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

      {/* Quick summary + global channel toggles */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Bell size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Alertas principales
            </p>
            <p className="text-xs text-slate-500">
              Por defecto recibirás avisos para tu(s) plantel(es) y todos los
              puestos. Puedes ajustar los canales aquí.
            </p>
            <p className="mt-2 text-[11px] text-slate-400">{scopeLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <QuickToggle
            label="Emails"
            icon={Mail}
            active={allEmailOn}
            onClick={toggleAllEmail}
          />
          <QuickToggle
            label="Panel"
            icon={Monitor}
            active={allPanelOn}
            onClick={toggleAllPanel}
          />
          <QuickToggle
            label="Push"
            icon={Wifi}
            active={allPushOn}
            onClick={toggleAllPush}
          />
        </div>
      </div>

      {/* Advanced section toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          ¿Necesitas reglas distintas por plantel o puesto específico? Usa las
          opciones avanzadas.
        </p>
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {showAdvanced ? (
            <>
              <XCircle size={11} /> Ocultar avanzadas
            </>
          ) : (
            <>
              <Plus size={11} /> Mostrar avanzadas
            </>
          )}
        </button>
      </div>

      {/* Advanced cards (simplified, more visual) */}
      {showAdvanced && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Reglas avanzadas
                </p>
                <p className="text-xs text-slate-400">
                  Ajusta los canales de notificación por plantel y/o puesto. La
                  coincidencia más específica tiene prioridad.
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

          <div className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                Aún no tienes reglas avanzadas. Agrega una para un plantel o
                puesto específico.
              </div>
            )}

            {rows.map((row, index) => {
              const plantelLabel =
                row.plantelId &&
                plantels.find((p) => p.id === row.plantelId)?.name;
              const jobLabel =
                row.jobTitleId &&
                jobTitles.find((t) => t.id === row.jobTitleId)?.name;

              return (
                <div
                  key={index}
                  className="px-4 py-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
                >
                  {/* Scope selectors */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Plantel
                      </label>
                      <select
                        value={row.plantelId}
                        onChange={(e) =>
                          updateRow(index, { plantelId: e.target.value })
                        }
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="">Todos los planteles</option>
                        {plantels.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Puesto
                      </label>
                      <select
                        value={row.jobTitleId}
                        onChange={(e) =>
                          updateRow(index, { jobTitleId: e.target.value })
                        }
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="">Todos los puestos</option>
                        {jobTitles.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {plantelLabel || "Todos los planteles"} •{" "}
                      {jobLabel || "Todos los puestos"}
                    </p>
                  </div>

                  {/* Channel groups */}
                  <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Email */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-1 mb-2">
                        <Mail size={11} className="text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-700">
                          Correo
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <TogglePill
                            active={row.emailNewEntries}
                            onClick={() =>
                              updateRow(index, {
                                emailNewEntries: !row.emailNewEntries,
                              })
                            }
                          />
                          <span className="text-[11px] text-slate-500">
                            Nuevas postulaciones
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TogglePill
                            active={row.emailStatusUpdates}
                            onClick={() =>
                              updateRow(index, {
                                emailStatusUpdates: !row.emailStatusUpdates,
                              })
                            }
                          />
                          <span className="text-[11px] text-slate-500">
                            Cambios de estado
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* In-app */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-1 mb-2">
                        <Monitor size={11} className="text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-700">
                          Panel (campana)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <TogglePill
                            active={row.inAppNewEntries}
                            onClick={() =>
                              updateRow(index, {
                                inAppNewEntries: !row.inAppNewEntries,
                              })
                            }
                          />
                          <span className="text-[11px] text-slate-500">
                            Nuevas postulaciones
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TogglePill
                            active={row.inAppStatusUpdates}
                            onClick={() =>
                              updateRow(index, {
                                inAppStatusUpdates: !row.inAppStatusUpdates,
                              })
                            }
                          />
                          <span className="text-[11px] text-slate-500">
                            Cambios de estado
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Push */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-1 mb-2">
                        <Wifi size={11} className="text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-700">
                          Push navegador
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <TogglePill
                            active={row.pushNewEntries}
                            onClick={() =>
                              updateRow(index, {
                                pushNewEntries: !row.pushNewEntries,
                              })
                            }
                          />
                          <span className="text-[11px] text-slate-500">
                            Nuevas postulaciones
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TogglePill
                            active={row.pushStatusUpdates}
                            onClick={() =>
                              updateRow(index, {
                                pushStatusUpdates: !row.pushStatusUpdates,
                              })
                            }
                          />
                          <span className="text-[11px] text-slate-500">
                            Cambios de estado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <div className="flex items-start justify-end md:w-20">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                      title="Eliminar regla"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save button (always visible) */}
      <div className="flex justify-end">
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

function QuickToggle({ label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <Icon size={11} />
      {label}
    </button>
  );
}
