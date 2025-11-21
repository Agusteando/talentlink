// --- src\components\dashboard\FavoriteButton.jsx ---
'use client';
import { useState } from 'react';
import { toggleApplicationFavorite } from '@/actions/job-actions';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FavoriteButton({ applicationId, initialStatus }) {
    const [isFav, setIsFav] = useState(initialStatus);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        const res = await toggleApplicationFavorite(applicationId);
        setLoading(false);
        
        if(res.success) {
            setIsFav(res.isFavorite);
            toast.success(res.isFavorite ? "Añadido a Cartera" : "Removido de Cartera");
        } else {
            toast.error("Error al actualizar");
        }
    };

    return (
        <button 
            onClick={handleToggle}
            disabled={loading}
            className={`p-2 rounded-full border transition-all shadow-sm
                ${isFav 
                    ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-amber-400'}`}
            title={isFav ? "En Cartera de Clientes" : "Agregar a Favoritos"}
        >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Star fill={isFav ? "currentColor" : "none"} size={20} />}
        </button>
    );
}