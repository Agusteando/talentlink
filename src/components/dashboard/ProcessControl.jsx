'use client';
import { useState } from 'react';
import { updateApplicationStatus } from '@/actions/job-actions';
import { CheckSquare, Square, Loader2 } from 'lucide-react';

export default function ProcessControl({ applicationId, currentStage, currentStatus }) {
  const [loading, setLoading] = useState(false);

  const stages = [
    { id: 1, label: "Entrevista Inicial (RH)" },
    { id: 2, label: "Entrevista Técnica (Jefe Área)" },
    { id: 3, label: "Pruebas Psicométricas / Signia" },
    { id: 4, label: "Oferta Económica & Contrato" }
  ];

  const handleStageUpdate = async (stageId) => {
    setLoading(true);
    // If clicking the same stage, do nothing or toggle? Assuming progress forward:
    await updateApplicationStatus(applicationId, { 
        interviewStage: stageId,
        // Auto-update status to INTERVIEW if it was NEW
        status: currentStatus === 'NEW' ? 'INTERVIEW' : currentStatus
    });
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
        Progreso de Reclutamiento
        {loading && <Loader2 className="animate-spin text-blue-600" size={16} />}
      </h3>
      
      <div className="space-y-2">
        {stages.map((stage) => {
          const isCompleted = currentStage >= stage.id;
          const isNext = currentStage === stage.id - 1;
          
          return (
            <button
              key={stage.id}
              onClick={() => handleStageUpdate(stage.id)}
              disabled={loading}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition text-left
                ${isCompleted 
                  ? 'bg-blue-50 border-blue-200 text-blue-800' 
                  : isNext 
                    ? 'bg-white border-blue-500 border-dashed hover:bg-slate-50' 
                    : 'bg-slate-50 border-transparent text-slate-400'
                }`}
            >
              <span className="flex items-center gap-3 text-sm font-bold">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs
                    ${isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {stage.id}
                </span>
                {stage.label}
              </span>
              {isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}