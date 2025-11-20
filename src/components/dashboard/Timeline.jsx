'use client';
import { addComment } from '@/actions/comment-actions';
import { Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useRef } from 'react';

export default function Timeline({ applicationId, comments, currentUser }) {
    const formRef = useRef(null);

    async function handleSubmit(formData) {
        const res = await addComment(formData);
        if (res?.success) {
            toast.success("Comentario agregado");
            formRef.current?.reset();
        } else {
            toast.error("Error");
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Historial y Notas</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {comments.length === 0 && (
                    <p className="text-center text-xs text-slate-400 mt-10">No hay comentarios aún.</p>
                )}
                {comments.map((c) => (
                    <div key={c.id} className={`flex gap-3 ${c.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 border border-blue-200">
                            <User size={14} />
                        </div>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            c.userId === currentUser.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                        }`}>
                            <p>{c.text}</p>
                            <div className={`text-[10px] mt-1 text-right ${c.userId === currentUser.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })} • {c.user.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-white border-t border-slate-100">
                <form ref={formRef} action={handleSubmit} className="flex gap-2">
                    <input type="hidden" name="applicationId" value={applicationId} />
                    <input 
                        type="text" 
                        name="text" 
                        placeholder="Escribe una nota..." 
                        required
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}