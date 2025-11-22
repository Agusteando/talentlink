
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function NotificationCenter({
  initialNotifications,
  onUnreadChange,
}) {
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const updateUnreadAndState = (updater) => {
    setNotifications((prev) => {
      const next = updater(prev);
      if (onUnreadChange) {
        const nextUnread = next.filter((n) => !n.readAt).length;
        onUnreadChange(nextUnread);
      }
      return next;
    });
  };

  const handleMarkRead = (id) => {
    updateUnreadAndState((prev) =>
      prev.map((n) =>
        n.id === id && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n
      )
    );

    startTransition(async () => {
      const res = await markNotificationRead(id);
      if (res?.error) {
        toast.error(res.error);
      }
    });
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;

    updateUnreadAndState((prev) =>
      prev.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() }
      )
    );

    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res?.error) {
        toast.error(res.error);
      }
    });
  };

  const handleOpen = (notif) => {
    const target = notif.link || "/dashboard";
    if (!notif.readAt) {
      handleMarkRead(notif.id);
    }
    router.push(target);
  };

  const formattedUnread =
    typeof unreadCount === "number" && unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[480px] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
            <Bell size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Notificaciones recientes
            </p>
            <p className="text-xs text-slate-400">
              {unreadCount > 0
                ? `${formattedUnread} pendientes de revisión`
                : "Todo al día"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || isPending}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:text-slate-300 flex items-center gap-1"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Marcar todo como leído
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400 flex-1 flex items-center justify-center">
          No tienes notificaciones todavía.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            const created = new Date(n.createdAt);
            const plantelName =
              n.plantel?.name || n.job?.plantel?.name || "Plantel no especificado";
            const jobTitle = n.job?.title || "";

            return (
              <li
                key={n.id}
                className={`flex gap-3 px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer ${
                  isUnread ? "bg-slate-50/60" : "bg-white"
                }`}
                onClick={() => handleOpen(n)}
              >
                <div className="mt-1 shrink-0">
                  {isUnread ? (
                    <Circle className="text-blue-500" size={14} />
                  ) : (
                    <CheckCircle2 className="text-slate-300" size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 truncate">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(created, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                    {n.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    {plantelName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                        <MapPin size={10} />
                        {plantelName}
                      </span>
                    )}
                    {jobTitle && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                        <Briefcase size={10} />
                        {jobTitle}
                      </span>
                    )}
                    {n.link && (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                        Ver detalle <ArrowRight size={10} />
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Ver todas
            <ArrowRight size={11} />
          </Link>
        </div>
        <Link
          href="/dashboard/settings/notifications"
          className="font-semibold text-blue-600 hover:underline"
        >
          Configurar
        </Link>
      </div>
    </div>
  );
}
