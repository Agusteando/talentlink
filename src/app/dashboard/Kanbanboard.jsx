// --- src\components\dashboard\KanbanBoard.jsx ---
'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { updateApplicationStatus } from '@/actions/job-actions';
import Link from 'next/link';
import { MoreHorizontal, MapPin, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const COLUMNS = {
    NEW: { id: 'NEW', title: 'En Revisión', color: 'bg-slate-100 text-slate-600' },
    INTERVIEW: { id: 'INTERVIEW', title: 'Entrevistas', color: 'bg-blue-50 text-blue-600' },
    TALENT_POOL: { id: 'TALENT_POOL', title: 'Cartera (Pool)', color: 'bg-purple-50 text-purple-600' },
    HIRED: { id: 'HIRED', title: 'Contratados', color: 'bg-green-50 text-green-600' },
    REJECTED: { id: 'REJECTED', title: 'Descartados', color: 'bg-red-50 text-red-600' }
};

export default function KanbanBoard({ initialData }) {
    // Group data by columns
    const [apps, setApps] = useState(initialData);

    const getColumnData = (status) => apps.filter(a => {
        // Logic: If status is TALENT_POOL, it goes there. If REJECTED, there. 
        // Note: 'isFavorite' usually implies Talent Pool, but let's stick to strict status for columns
        return a.status === status;
    });

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside
        if (!destination) return;
        // Dropped in same place
        if (source.droppableId === destination.droppableId) return;

        const newStatus = destination.droppableId;
        
        // 1. Optimistic Update (UI First)
        const updatedApps = apps.map(app => 
            app.id === draggableId ? { ...app, status: newStatus } : app
        );
        setApps(updatedApps);

        // 2. Server Update (No Email by default on Drag Drop for safety)
        // We prefer explicit email sending via the Modal inside the detail page
        const res = await updateApplicationStatus(draggableId, { status: newStatus }, false);
        
        if (res.success) {
            toast.success(`Movido a ${COLUMNS[newStatus].title}`);
        } else {
            toast.error("Error al actualizar");
            setApps(initialData); // Revert
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {Object.values(COLUMNS).map(col => (
                    <div key={col.id} className="w-80 flex-shrink-0 flex flex-col bg-slate-50 rounded-xl border border-slate-200 max-h-full">
                        {/* Header */}
                        <div className={`p-3 font-bold text-sm border-b border-slate-100 flex justify-between items-center ${col.color} rounded-t-xl`}>
                            {col.title}
                            <span className="bg-white/50 px-2 py-0.5 rounded text-xs">
                                {getColumnData(col.id).length}
                            </span>
                        </div>

                        {/* Droppable Area */}
                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100' : ''}`}
                                >
                                    {getColumnData(col.id).map((app, index) => (
                                        <Draggable key={app.id} draggableId={app.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition group
                                                        ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-blue-500/20' : 'border-slate-200'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                            {app.job.title}
                                                        </span>
                                                        {app.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400" />}
                                                    </div>
                                                    
                                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{app.fullName}</h4>
                                                    
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-3">
                                                        <MapPin size={10} /> {app.job.plantel?.name || 'N/A'}
                                                    </div>

                                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2 mt-2">
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(app.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <Link 
                                                            href={`/dashboard/application/${app.id}`}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}