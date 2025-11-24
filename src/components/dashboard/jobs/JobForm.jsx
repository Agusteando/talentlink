
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createJob, updateJob } from "@/actions/job-actions";
import { createPuesto } from "@/actions/puesto-actions";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  ArrowLeft,
  Search,
  Check,
  X,
  Briefcase,
  ChevronDown,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function JobForm({
  initialData,
  plantels,
  jobTitles = [],
  isEdit = false,
  canManageCatalog = false,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Local catalog state for inline add
  const [titles, setTitles] = useState(jobTitles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPuesto, setSelectedPuesto] = useState(
    initialData?.jobTitleId
      ? jobTitles.find((t) => t.id === initialData.jobTitleId)
      : null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Inline Nuevo Puesto modal state
  const [isPuestoModalOpen, setIsPuestoModalOpen] = useState(false);
  const [newPuestoName, setNewPuestoName] = useState("");
  const [newPuestoCategory, setNewPuestoCategory] = useState("Academico");
  const [creatingPuesto, setCreatingPuesto] = useState(false);

  useEffect(() => {
    if (selectedPuesto) setSearchTerm(selectedPuesto.name);
  }, [selectedPuesto]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        if (selectedPuesto) setSearchTerm(selectedPuesto.name);
        else setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedPuesto]);

  const filteredPuestos = useMemo(() => {
    if (!searchTerm) return titles.filter((t) => t.isActive);
    return titles.filter(
      (t) => t.isActive && t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, titles]);

  const handleSelectPuesto = (puesto) => {
    setSelectedPuesto(puesto);
    setSearchTerm(puesto.name);
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    setSelectedPuesto(null);
    setSearchTerm("");
    setIsDropdownOpen(true);
  };

  async function handleSubmit(formData) {
    if (!selectedPuesto) {
      toast.error("Debes seleccionar un Puesto del catálogo.");
      return;
    }

    setLoading(true);
    formData.set("jobTitleId", selectedPuesto.id);

    let res;
    if (isEdit) {
      res = await updateJob(formData);
    } else {
      res = await createJob(formData);
    }

    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(isEdit ? "Vacante actualizada" : "Vacante publicada");
      router.push("/dashboard/jobs");
      router.refresh();
    }
  }

  const dateValue = initialData?.closingDate
    ? new Date(initialData.closingDate).toISOString().split("T")[0]
    : "";

  const openPuestoModal = () => {
    setNewPuestoName("");
    setNewPuestoCategory("Academico");
    setIsPuestoModalOpen(true);
  };

  const handleCreatePuesto = async () => {
    if (!newPuestoName.trim()) {
      toast.error("Ingresa un nombre de puesto.");
      return;
    }
    setCreatingPuesto(true);
    try {
      const fd = new FormData();
      fd.set("name", newPuestoName.trim());
      fd.set("category", newPuestoCategory);
      const res = await createPuesto(fd);
      if (res?.success && res?.puesto) {
        setTitles((prev) => [...prev, { ...res.puesto }]);
        setSelectedPuesto(res.puesto);
        setSearchTerm(res.puesto.name);
        toast.success("Puesto creado");
        setIsPuestoModalOpen(false);
      } else {
        toast.error(res?.error || "No se pudo crear el puesto.");
      }
    } catch (e) {
      toast.error("Error de red");
    } finally {
      setCreatingPuesto(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/jobs"
          className="p-2 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit ? `Editar: ${initialData.title}` : "Crear Nueva Vacante"}
        </h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <form action={handleSubmit} className="space-y-6">
          {isEdit && <input type="hidden" name="jobId" value={initialData.id} />}

          {/* Puesto selector and actions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Puesto (Obligatorio)
              </label>
              <div className="flex items-center gap-2">
                {canManageCatalog && (
                  <button
                    type="button"
                    onClick={openPuestoModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                  >
                    <Plus size={14} /> Nuevo Puesto
                  </button>
                )}
                <Link
                  href="/dashboard/puestos"
                  className="text-[11px] font-bold text-slate-500 hover:text-blue-700 hover:underline"
                  title="Abrir Catálogo de Puestos"
                >
                  Catálogo de Puestos
                </Link>
              </div>
            </div>

            {/* SEARCHABLE PUESTO */}
            <div className="col-span-2 relative" ref={dropdownRef}>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Search size={18} />
                </div>

                <input
                  type="text"
                  placeholder="Buscar puesto..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedPuesto) setSelectedPuesto(null);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className={`w-full pl-10 pr-10 p-3 border rounded-lg outline-none transition font-medium
                    ${
                      isDropdownOpen
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-slate-300"
                    }
                    ${
                      selectedPuesto
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-white text-slate-700"
                    }`}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition"
                  >
                    <X size={18} />
                  </button>
                )}

                {!searchTerm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={18} />
                  </div>
                )}
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {filteredPuestos.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-500 mb-2">
                        No se encontraron puestos.
                      </p>
                      {canManageCatalog ? (
                        <button
                          type="button"
                          onClick={openPuestoModal}
                          className="inline-flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          <Briefcase size={14} /> Crear Nuevo Puesto
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Contacta al administrador para agregar uno.
                        </span>
                      )}
                    </div>
                  ) : (
                    <ul className="py-2">
                      {filteredPuestos.map((p) => (
                        <li
                          key={p.id}
                          onClick={() => handleSelectPuesto(p)}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <span className="block font-bold text-slate-800 group-hover:text-blue-700">
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-blue-50 group-hover:text-blue-600">
                              {p.category || "General"}
                            </span>
                          </div>
                          {selectedPuesto?.id === p.id && (
                            <Check size={16} className="text-blue-600" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Plantel y tipo de contrato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Plantel
              </label>
              <select
                name="plantelId"
                defaultValue={initialData?.plantelId}
                required
                className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">-- Seleccionar --</option>
                {plantels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Tipo de Contrato
              </label>
              <select
                name="type"
                defaultValue={initialData?.type || "Tiempo Completo"}
                className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="Tiempo Completo">Tiempo Completo</option>
                <option value="Medio Tiempo">Medio Tiempo</option>
                <option value="Por Horas">Por Horas / Asignatura</option>
                <option value="Temporal">Temporal / Proyecto</option>
              </select>
            </div>
          </div>

          {/* Departamento y rango salarial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Departamento
              </label>
              <input
                name="department"
                defaultValue={initialData?.department}
                required
                placeholder="Ej. Control Escolar"
                className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Rango Salarial (Opcional)
              </label>
              <input
                name="salaryRange"
                defaultValue={initialData?.salaryRange || ""}
                placeholder="Ej. $12,000 - $15,000 MXN mensuales"
                className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition text-sm"
              />
            </div>
          </div>

          {/* Estado y fecha límite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Estado
              </label>
              <select
                name="status"
                defaultValue={initialData?.status || "OPEN"}
                className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition"
              >
                <option value="OPEN">🟢 Activa</option>
                <option value="PAUSED">🟡 Pausada</option>
                <option value="CLOSED">🔴 Cerrada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Fecha Límite (Opcional)
              </label>
              <input
                type="date"
                name="closingDate"
                defaultValue={dateValue}
                className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              rows={8}
              required
              className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition font-sans leading-relaxed"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {loading
                ? "Guardando..."
                : isEdit
                ? "Guardar Cambios"
                : "Publicar Vacante"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Nuevo Puesto */}
      {isPuestoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                Registrar Nuevo Puesto
              </h3>
              <button
                onClick={() => setIsPuestoModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nombre del Puesto
                </label>
                <input
                  value={newPuestoName}
                  onChange={(e) => setNewPuestoName(e.target.value)}
                  placeholder="Ej. Docente Matemáticas"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Categoría
                </label>
                <select
                  value={newPuestoCategory}
                  onChange={(e) => setNewPuestoCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Academico">Académico</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Intendencia">Intendencia / Mantenimiento</option>
                  <option value="Directivo">Directivo</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsPuestoModalOpen(false)}
                className="px-4 py-2 text-slate-500 font-bold text-sm rounded-lg hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePuesto}
                disabled={creatingPuesto}
                className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-blue-600 transition shadow-lg flex items-center gap-2"
              >
                {creatingPuesto ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}
                Crear Puesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
