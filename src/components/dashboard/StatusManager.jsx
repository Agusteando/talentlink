// --- src\components\dashboard\StatusManager.jsx ---
'use client';

import { useState } from 'react';
import { updateApplicationStatus, getStatusEmailPreview } from '@/actions/job-actions';
import { Check, X, Eye, Send, Loader2, AlertCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StatusManager({ applicationId, currentStatus }) {
    const [status, setStatus] = useState(currentStatus);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sendEmail, setSendEmail] = useState(false); // OFF BY DEFAULT

    const statusOptions = [
        { value: 'NEW', label: 'En Revisión', color: 'bg-slate-100 text-slate-700' },
        { value: 'INTERVIEW', label: 'En Entrevistas', color: 'bg-blue-100 text-blue-700' },
        { value: 'TALENT_POOL', label: 'Cartera / Pool (Guardar para después)', color: 'bg-purple-100 text-purple-700' }, 
        { value: 'HIRED', label: '✅ Contratado', color: 'bg-green-100 text-green-700' },
        { value: 'REJECTED', label: '❌ Descartado', color: 'bg-red-100 text-red-700' }
    ];

    const handleInitiateChange = (e) => {
        e.preventDefault();
        if (status === currentStatus) return;
        setIsModalOpen(true);
        setPreviewHtml(null);
        setSendEmail(false); // Ensure reset
    };

    const loadPreview = async () => {
        setLoading(true);
        const res = await getStatusEmailPreview(applicationId, status);
        setLoading(false);
        if (res.success) setPreviewHtml(res.html);
    };

    const confirmUpdate = async () => {
        setLoading(true);
        const res = await updateApplicationStatus(applicationId, { status }, sendEmail);
        setLoading(false);
        if (res.success) {
            toast.success(sendEmail ? "Actualizado y notificado" : "Estado actualizado");
            setIsModalOpen(false);
        } else {
            toast.error("Error");
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleInitiateChange} className="p-4 bg-white border-t border-gray-200 sticky bottom-0 z-10">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Estado del Candidato</label>
                <div className="flex gap-2">
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className={`flex-1 p-3 border rounded-lg text-sm font-bold outline-none appearance-none cursor-pointer
                        ${statusOptions.find(o => o.value === status)?.color || 'bg-white'}`}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button 
                        type="submit" 
                        disabled={status === currentStatus}
                        className="px-6 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-blue-600 disabled:opacity-50 transition shadow-lg"
                    >
                        Actualizar
                    </button>
                </div>
            </form>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Confirmar Acción</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-700"/></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6 text-center">
                                <p className="text-slate-500 text-sm mb-2">Cambiando estado a:</p>
                                <span className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${statusOptions.find(o => o.value === status)?.color}`}>
                                    {statusOptions.find(o => o.value === status)?.label}
                                </span>
                            </div>

                            {/* EMAIL TOGGLE - OFF BY DEFAULT */}
                            <div className={`p-4 rounded-xl border transition-all mb-4 ${sendEmail ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSendEmail(!sendEmail)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${sendEmail ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        {sendEmail && <Check size={14} className="text-white" />}
                                    </div>
                                    <label className="text-sm font-bold text-slate-700 cursor-pointer select-none">Enviar correo de notificación</label>
                                </div>
                                
                                {sendEmail && (
                                    <div className="mt-3 pl-8">
                                        <button 
                                            type="button"
                                            onClick={loadPreview} 
                                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <Eye size={12} /> {previewHtml ? 'Actualizar Vista Previa' : 'Ver Vista Previa'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {sendEmail && previewHtml && (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">Vista Previa</div>
                                    <div className="p-4 bg-white h-48 overflow-y-auto text-xs text-slate-600">
                                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-lg transition">Cancelar</button>
                            <button 
                                onClick={confirmUpdate} 
                                disabled={loading}
                                className="px-6 py-2 bg-slate-900 text-white font-bold text-sm hover:bg-blue-600 rounded-lg shadow-lg flex items-center gap-2 transition"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}