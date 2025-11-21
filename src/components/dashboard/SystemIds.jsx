// --- src\components\dashboard\SystemIds.jsx ---
'use client';
import { useState } from 'react';
import { updateApplicationStatus } from '@/actions/job-actions';
import { Shield, CheckCircle, Circle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SystemIds({ applicationId, ids }) {
    const [formIds, setFormIds] = useState({
        signiaId: ids.signiaId || '',
        evaId: ids.evaId || '',
        pathId: ids.pathId || ''
    });
    const [loading, setLoading] = useState(false);

    // Calculate "Checklist" Progress
    const steps = [
        { key: 'signiaId', label: 'Signia ID' },
        { key: 'evaId', label: 'Eva ID' },
        { key: 'pathId', label: 'Path ID' }
    ];
    
    const completedCount = steps.filter(s => formIds[s.key].length > 0).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    const handleSave = async () => {
        setLoading(true);
        const res = await updateApplicationStatus(applicationId, formIds);
        setLoading(false);
        if (res.success) toast.success("IDs actualizados");
        else toast.error("Error");
    };

    const handleChange = (key, val) => {
        setFormIds(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
             <div className="p-4 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
                 <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                    <Shield size={16}/> Checklist de Sistemas
                 </h3>
                 <span className="text-[10px] font-bold bg-white text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">
                    {progress}% Completado
                 </span>
             </div>

             <div className="p-4 space-y-4">
                {steps.map((step) => (
                    <div key={step.key} className="flex items-center gap-3">
                        <div className={formIds[step.key] ? "text-green-500" : "text-slate-300"}>
                            {formIds[step.key] ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{step.label}</label>
                            <input 
                                value={formIds[step.key]} 
                                onChange={(e) => handleChange(step.key, e.target.value)}
                                placeholder="-- Vacío --"
                                className="w-full text-xs font-bold border-b border-slate-200 focus:border-indigo-500 outline-none py-1 text-slate-700 placeholder:font-normal"
                            />
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full mt-2 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                    {loading ? 'Guardando...' : 'Guardar Progreso'}
                </button>
             </div>
        </div>
    );
}