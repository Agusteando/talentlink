// --- src\components\dashboard\jobs\JobForm.jsx ---
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createJob, updateJob } from '@/actions/job-actions';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Search, Check, X, Briefcase, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function JobForm({ initialData, plantels, jobTitles = [], isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // AutoComplete State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState(
    initialData?.jobTitleId 
        ? jobTitles.find(t => t.id === initialData.jobTitleId) 
        : null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
      if (selectedPuesto) setSearchTerm(selectedPuesto.name);
  }, [selectedPuesto]);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
              setIsDropdownOpen(false);
              if (selectedPuesto) setSearchTerm(selectedPuesto.name);
              else setSearchTerm('');
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedPuesto]);

  const filteredPuestos = useMemo(() => {
      if (!searchTerm) return jobTitles.filter(t => t.isActive);
      return jobTitles.filter(t => 
          t.isActive && 
          t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [searchTerm, jobTitles]);

  const handleSelectPuesto = (puesto) => {
      setSelectedPuesto(puesto);
      setSearchTerm(puesto.name);
      setIsDropdownOpen(false);
  };

  const clearSelection = () => {
      setSelectedPuesto(null);
      setSearchTerm('');
      setIsDropdownOpen(true);
  };

  async function handleSubmit(formData) {
    if (!selectedPuesto) {
        toast.error("Debes seleccionar un Puesto del catálogo.");
        return;
    }

    setLoading(true);
    formData.set('jobTitleId', selectedPuesto.id);

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
        router.push('/dashboard/jobs');
        router.refresh();
    }
  }

  const dateValue = initialData?.closingDate 
    ? new Date(initialData.closingDate).toISOString().split('T')[0] 
    : '';

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/jobs" className="p-2 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-100 text-slate-600 transition">
                <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">
                {isEdit ? `Editar: ${initialData.title}` : 'Crear Nueva Vacante'}
            </h1>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <form action={handleSubmit} className="space-y-6">
                {isEdit && <input type="hidden" name="jobId" value={initialData.id} />}
                
                {/* SEARCHABLE PUESTO */}
                <div className="col-span-2 relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        Puesto (Obligatorio) <span className="text-red-500">*</span>
                    </label>
                    
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
                                if(selectedPuesto) setSelectedPuesto(null);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className={`w-full pl-10 pr-10 p-3 border rounded-lg outline-none transition font-medium
                                ${isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-300'}
                                ${selectedPuesto ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-white text-slate-700'}`}
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
                                    <p className="text-sm text-slate-500 mb-2">No se encontraron puestos.</p>
                                    <Link 
                                        href="/dashboard/puestos" 
                                        target="_blank"
                                        className="inline-flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition"
                                    >
                                        <Briefcase size={14} /> Crear Nuevo Puesto
                                    </Link>
                                </div>
                            ) : (
                                <ul className="py-2">
                                    {filteredPuestos.map(p => (
                                        <li 
                                            key={p.id}
                                            onClick={() => handleSelectPuesto(p)}
                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group border-b border-slate-50 last:border-0"
                                        >
                                            <div>
                                                <span className="block font-bold text-slate-800 group-hover:text-blue-700">{p.name}</span>
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-blue-50 group-hover:text-blue-600">
                                                    {p.category || 'General'}
                                                </span>
                                            </div>
                                            {selectedPuesto?.id === p.id && <Check size={16} className="text-blue-600"/>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plantel</label>
                        <select 
                            name="plantelId" 
                            defaultValue={initialData?.plantelId} 
                            required 
                            className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition cursor-pointer"
                        >
                            <option value="">-- Seleccionar --</option>
                            {plantels.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* FIXED: MISSING JOB TYPE INPUT */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Contrato</label>
                        <select 
                            name="type" 
                            defaultValue={initialData?.type || 'Tiempo Completo'} 
                            className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition cursor-pointer"
                        >
                            <option value="Tiempo Completo">Tiempo Completo</option>
                            <option value="Medio Tiempo">Medio Tiempo</option>
                            <option value="Por Horas">Por Horas / Asignatura</option>
                            <option value="Temporal">Temporal / Proyecto</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Departamento</label>
                        <input 
                            name="department" 
                            defaultValue={initialData?.department} 
                            required 
                            placeholder="Ej. Control Escolar"
                            className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition" 
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estado</label>
                        <select 
                            name="status" 
                            defaultValue={initialData?.status || 'OPEN'} 
                            className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none focus:border-blue-500 transition"
                        >
                            <option value="OPEN">🟢 Activa</option>
                            <option value="PAUSED">🟡 Pausada</option>
                            <option value="CLOSED">🔴 Cerrada</option>
                        </select>
                     </div>
                </div>

                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha Límite (Opcional)</label>
                     <input 
                        type="date" 
                        name="closingDate" 
                        defaultValue={dateValue}
                        className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500 transition text-slate-600" 
                     />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción</label>
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
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Publicar Vacante')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}