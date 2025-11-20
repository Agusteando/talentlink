'use client';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ExportButton({ applications }) {
  const handleExport = () => {
    try {
      // Format data for Excel
      const data = applications.map(app => ({
        Candidato: app.fullName,
        Email: app.user.email,
        Telefono: app.phone || 'N/A',
        Vacante: app.job.title,
        Plantel: app.job.plantel,
        Depto: app.job.department,
        Estado: app.status,
        'Fecha Postulacion': new Date(app.createdAt).toLocaleDateString(),
        'Signia ID': app.signiaId || '',
        'Eva ID': app.evaId || '',
        'Path ID': app.pathId || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatos");
      
      // Generate file
      XLSX.writeFile(workbook, `TalentLink_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
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