// --- src\components\dashboard\DynamicChecklist.jsx ---
'use client';
import { useState } from 'react';
import { saveChecklistValues } from '@/actions/checklist-actions';
import { ListChecks, CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DynamicChecklist({ applicationId, templates, existingValues }) {
    // Convert array of existing values to map for easy lookup
    const initialValues = {};
    existingValues.forEach(v => {
        initialValues[v.templateId] = v.value;
    });

    const [values, setValues] = useState(initialValues);
    const [loading, setLoading] = useState(false);

    // Calculate progress based on Active Templates
    const activeTemplates = templates.filter(t => t.isActive);
    const filledCount = activeTemplates.filter(t => {
        const val = values[t.id];
        return val && val !== '' && val !== 'false';
    }).length;
    
    const progress = activeTemplates.length > 0 
        ? Math.round((filledCount / activeTemplates.length) * 100) 
        : 0;

    const handleChange = (templateId, newValue) => {
        setValues(prev => ({ ...prev, [templateId]: newValue }));
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await saveChecklistValues(applicationId, values);
        setLoading(false);
        
        if (res.success) toast.success("Checklist guardado");
        else toast.error("Error al guardar");
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
            <div className="p-4 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
                 <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                    <ListChecks size={16}/> Checklist de Proceso
                 </h3>
                 <span className="text-[10px] font-bold bg-white text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">
                    {progress}% Completado
                 </span>
            </div>

            <div className="p-4 space-y-4">
                {activeTemplates.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center">No hay campos configurados por el Admin.</p>
                )}

                {activeTemplates.map(t => (
                    <div key={t.id} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t.name}</label>
                        
                        {t.type === 'TEXT' && (
                            <input 
                                type="text" 
                                value={values[t.id] || ''} 
                                onChange={(e) => handleChange(t.id, e.target.value)}
                                className="w-full text-sm border border-slate-200 rounded p-2 outline-none focus:border-indigo-500 transition"
                                placeholder="..."
                            />
                        )}
                        
                        {t.type === 'DATE' && (
                            <input 
                                type="date" 
                                value={values[t.id] || ''} 
                                onChange={(e) => handleChange(t.id, e.target.value)}
                                className="w-full text-sm border border-slate-200 rounded p-2 outline-none focus:border-indigo-500 transition text-slate-600"
                            />
                        )}

                        {t.type === 'CHECKBOX' && (
                            <button 
                                onClick={() => handleChange(t.id, values[t.id] === 'true' ? 'false' : 'true')}
                                className={`flex items-center gap-2 p-2 rounded border transition w-full text-sm ${values[t.id] === 'true' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                            >
                                {values[t.id] === 'true' ? <CheckSquare size={16}/> : <Square size={16}/>}
                                {values[t.id] === 'true' ? 'Completado' : 'Pendiente'}
                            </button>
                        )}
                    </div>
                ))}

                {activeTemplates.length > 0 && (
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full mt-2 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={14} />}
                        Guardar Progreso
                    </button>
                )}
            </div>
        </div>
    );
}