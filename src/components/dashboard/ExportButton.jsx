
"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { getApplicationStatusLabel } from "@/lib/status-labels";

export default function ExportButton({ applications, checklistTemplates }) {
  const handleExport = () => {
    try {
      const now = new Date();
      const templates = Array.isArray(checklistTemplates)
        ? checklistTemplates
        : [];

      console.debug("[ExportButton] Generating Excel", {
        appCount: applications?.length || 0,
        templateCount: templates.length,
      });

      const rows = (applications || []).map((app) => {
        const applied = new Date(app.createdAt);
        const last = new Date(app.updatedAt);
        const daysSince = Math.max(
          0,
          Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
        );
        const statusLabel = getApplicationStatusLabel(app.status);

        const base = {
          Candidato: app.fullName,
          Email: app.user?.email || app.email || "",
          Teléfono: app.phone || "",
          Vacante: app.job?.title || "",
          Plantel: app.job?.plantel?.name || "",
          Departamento: app.job?.department || "",
          Estado: statusLabel,
          "Fecha Postulación": applied.toLocaleDateString("es-MX"),
          "Última Actividad": last.toLocaleString("es-MX"),
          "Días Desde Aplicación": daysSince,
        };

        const valueMap = {};
        if (Array.isArray(app.checklistValues)) {
          for (const cv of app.checklistValues) {
            valueMap[cv.templateId] = cv.value || "";
          }
        }

        templates.forEach((tpl) => {
          base[tpl.name] = valueMap[tpl.id] || "";
        });

        return base;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatos");

      XLSX.writeFile(
        workbook,
        `TalentLink_Reporte_${new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "")}.xlsx`
      );
      toast.success("Reporte descargado");
    } catch (error) {
      console.error("[ExportButton] Error generating Excel", error);
      toast.error("Error al generar Excel");
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
    >
      <Download size={16} />
      <span className="hidden md:inline">Exportar Excel</span>
    </button>
  );
}
