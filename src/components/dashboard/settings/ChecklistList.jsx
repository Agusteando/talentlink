
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  GripVertical,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  toggleChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from "@/actions/checklist-actions";
import { toast } from "react-hot-toast";

export default function ChecklistList({ items, typeLabels }) {
  const [localItems, setLocalItems] = useState(items || []);
  const [draggingId, setDraggingId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  const moveItem = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setLocalItems((prev) => {
      const current = [...prev];
      const fromIndex = current.findIndex((i) => i.id === fromId);
      const toIndex = current.findIndex((i) => i.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      return current;
    });
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (!draggingId || draggingId === id) return;
    moveItem(draggingId, id);
  };

  const handleDrop = () => {
    if (!draggingId) return;
    const orderedIds = localItems.map((i) => i.id);
    setDraggingId(null);

    startTransition(async () => {
      const res = await reorderChecklistItems(orderedIds);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Orden actualizado");
      }
    });
  };

  const handleToggle = (item) => {
    setActionId(item.id);
    setLocalItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, isActive: !item.isActive } : it
      )
    );

    startTransition(async () => {
      const res = await toggleChecklistItem(item.id, item.isActive);
      setActionId(null);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          item.isActive ? "Campo desactivado" : "Campo activado"
        );
      }
    });
  };

  const handleDelete = (item) => {
    if (!window.confirm(`¿Eliminar el campo "${item.name}"?`)) return;

    setActionId(item.id);
    setLocalItems((prev) => prev.filter((it) => it.id !== item.id));

    startTransition(async () => {
      const res = await deleteChecklistItem(item.id);
      setActionId(null);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Campo eliminado");
      }
    });
  };

  return (
    <div className="space-y-3">
      {localItems.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Aún no has configurado campos de checklist.
        </div>
      )}

      {localItems.map((item) => {
        const isDragging = draggingId === item.id;
        const isBusy = actionId === item.id && isPending;
        const typeLabel =
          typeLabels?.[item.type] || typeLabels?.[item.type?.toUpperCase()] || item.type;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={handleDrop}
            onDragEnd={() => setDraggingId(null)}
            className={`flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm transition
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/40"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="cursor-grab text-slate-400 active:cursor-grabbing">
                <GripVertical size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {item.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border
                      ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                  >
                    {item.isActive ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <Circle size={10} />
                    )}
                    {item.isActive ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                    {typeLabel}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ID: {item.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggle(item)}
                disabled={isBusy}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1
                  ${
                    item.isActive
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {isBusy ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : item.isActive ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <Circle size={12} />
                )}
                {item.isActive ? "Activo" : "Inactivo"}
              </button>

              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={isBusy}
                className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-600 transition"
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          </div>
        );
      })}

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          <span>Guardando cambios...</span>
        </div>
      )}
    </div>
  );
}
