// --- src\components\dashboard\InterviewScheduler.jsx ---
'use client';
import { useState } from 'react';
import { updateApplicationStatus } from '@/actions/job-actions';
import { Calendar, Clock, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function InterviewScheduler({ applicationId, initialDate, status }) {
    const [date, setDate] = useState(initialDate ? new Date(initialDate).toISOString().slice(0, 16) : '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!date) return toast.error("Selecciona una fecha y hora");
        setLoading(true);
        
        // Saving date automatically sets status to INTERVIEW if not already
        const res = await updateApplicationStatus(applicationId, { 
            interviewDate: new Date(date),
            status: status === 'NEW' ? 'INTERVIEW' : status
        });

        setLoading(false);
        if (res.success) toast.success("Entrevista agendada");
        else toast.error("Error al guardar");
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="text-blue-600" size={18} />
                Agendar Entrevista
            </h3>
            
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Fecha y Hora</label>
                    <input 
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                    />
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="h-[38px] px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center justify-center"
                >
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                </button>
            </div>
            
            {initialDate && (
                <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded text-xs text-green-700 flex items-center gap-2">
                    <Clock size={12} />
                    Agendada actualmente: <strong>{format(new Date(initialDate), 'dd/MM/yyyy HH:mm')}</strong>
                </div>
            )}
        </div>
    );
}