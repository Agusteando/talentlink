// --- src\app\thank-you\page.js ---
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CheckCircle size={48} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">¡Recibido!</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
                Tu postulación ha sido enviada correctamente a nuestra base de datos. 
                Nuestro equipo de Recursos Humanos revisará tu perfil y te contactará por correo electrónico si eres seleccionado para una entrevista.
            </p>
            
            <Link href="/" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition shadow-lg">
                <ArrowLeft size={18} /> Volver al Inicio
            </Link>
        </div>
    </div>
  );
}