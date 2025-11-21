
"use client";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ExportButton({ applications }) {
  const handleExport = () => {
    try {
      const now = new Date();
      // Format data for Excel with temporal context
      const data = applications.map((app) => {
        const applied = new Date(app.createdAt);
        const last = new Date(app.updatedAt);
        const daysSince = Math.max(0, Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          Candidato: app.fullName,
          Email: app.user?.email || app.email || "",
          Telefono: app.phone || "N/A",
          Vacante: app.job?.title || "",
          Plantel: app.job?.plantel?.name || "",
          Depto: app.job?.department || "",
          Estado: app.status,
          "Fecha Postulacion": applied.toLocaleDateString(),
          "Ultima Actividad": last.toLocaleString(),
          "Dias Desde Aplicacion": daysSince,
          "Signia ID": app.signiaId || "",
          "Eva ID": app.evaId || "",
          "Path ID": app.pathId || ""
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatos");
      
      XLSX.writeFile(workbook, `TalentLink_Reporte_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Reporte descargado");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar Excel");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
    >
      <Download size={16} />
      <span className="hidden md:inline">Excel</span>
    </button>
  );
}
