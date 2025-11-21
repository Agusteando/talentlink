// --- src\components\dashboard\KanbanBoard.jsx ---
'use client';

import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { updateApplicationStatus } from '@/actions/job-actions';
import Link from 'next/link';
import { MoreHorizontal, MapPin, Star, Search, Filter, X, Building2, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';

const COLUMNS = {
    NEW: { id: 'NEW', title: 'En Revisión', color: 'bg-slate-100 text-slate-600' },
    INTERVIEW: { id: 'INTERVIEW', title: 'Entrevistas', color: 'bg-blue-50 text-blue-600' },
    TALENT_POOL: { id: 'TALENT_POOL', title: 'Cartera (Pool)', color: 'bg-purple-50 text-purple-600' },
    HIRED: { id: 'HIRED', title: 'Contratados', color: 'bg-green-50 text-green-600' },
    REJECTED: { id: 'REJECTED', title: 'Descartados', color: 'bg-red-50 text-red-600' }
};

export default function KanbanBoard({ initialData, plantels, jobTitles }) {
    const [apps, setApps] = useState(initialData);
    
    // --- FILTER STATE ---
    const [search, setSearch] = useState('');
    const [filterPlantel, setFilterPlantel] = useState('');
    const [filterPuesto, setFilterPuesto] = useState('');

    // --- FILTER LOGIC ---
    const filteredApps = useMemo(() => {
        return apps.filter(app => {
            // 1. Search Text (Name or Email)
            const matchesSearch = search === '' || 
                app.fullName.toLowerCase().includes(search.toLowerCase()) ||
                app.email.toLowerCase().includes(search.toLowerCase());

            // 2. Filter Plantel
            const matchesPlantel = filterPlantel === '' || app.job.plantelId === filterPlantel;

            // 3. Filter Puesto (Job Title)
            // Note: We check jobTitleId if linked, or fallback to title string for legacy
            const matchesPuesto = filterPuesto === '' || 
                app.job.jobTitleId === filterPuesto ||
                (!app.job.jobTitleId && app.job.title.includes(filterPuesto)); // loose match for legacy

            return matchesSearch && matchesPlantel && matchesPuesto;
        });
    }, [apps, search, filterPlantel, filterPuesto]);

    // Group data by columns
    const getColumnData = (status) => filteredApps.filter(a => a.status === status);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId) return;

        const newStatus = destination.droppableId;
        
        // Optimistic Update
        const updatedApps = apps.map(app => 
            app.id === draggableId ? { ...app, status: newStatus } : app
        );
        setApps(updatedApps);

        const res = await updateApplicationStatus(draggableId, { status: newStatus }, false);
        
        if (res.success) {
            toast.success(`Movido a ${COLUMNS[newStatus].title}`);
        } else {
            toast.error("Error al actualizar");
            setApps(initialData); // Revert
        }
    };

    const clearFilters = () => {
        setSearch('');
        setFilterPlantel('');
        setFilterPuesto('');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* --- TOOLBAR --- */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shrink-0">
                
                {/* Search Input */}
                <div className="relative w-full lg:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Buscar candidato..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                {/* Dropdowns */}
                <div className="flex gap-2 w-full lg:w-auto overflow-x-auto">
                    
                    {/* Plantel Filter */}
                    <div className="relative min-w-[180px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Building2 size={14} />
                        </div>
                        <select 
                            value={filterPlantel} 
                            onChange={(e) => setFilterPlantel(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm appearance-none cursor-pointer font-medium text-slate-600 focus:border-blue-500 outline-none"
                        >
                            <option value="">Todos los Planteles</option>
                            {plantels.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Puesto Filter */}
                    <div className="relative min-w-[180px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Briefcase size={14} />
                        </div>
                        <select 
                            value={filterPuesto} 
                            onChange={(e) => setFilterPuesto(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm appearance-none cursor-pointer font-medium text-slate-600 focus:border-blue-500 outline-none"
                        >
                            <option value="">Todos los Puestos</option>
                            {jobTitles.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Button */}
                    {(search || filterPlantel || filterPuesto) && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition shrink-0"
                        >
                            <X size={14} /> Borrar
                        </button>
                    )}
                </div>

                {/* Count */}
                <div className="text-xs font-bold text-slate-400 hidden xl:block">
                    {filteredApps.length} resultados
                </div>
            </div>

            {/* --- KANBAN AREA --- */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-100/50">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-4 p-6 min-w-max">
                        {Object.values(COLUMNS).map(col => {
                            const colData = getColumnData(col.id);
                            return (
                                <div key={col.id} className="w-80 flex-shrink-0 flex flex-col bg-slate-50 rounded-xl border border-slate-200 shadow-sm max-h-full">
                                    {/* Column Header */}
                                    <div className={`p-3 font-bold text-sm border-b border-slate-100 flex justify-between items-center ${col.color} rounded-t-xl`}>
                                        {col.title}
                                        <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs shadow-sm">
                                            {colData.length}
                                        </span>
                                    </div>

                                    {/* Droppable Area */}
                                    <Droppable droppableId={col.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors 
                                                    ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}
                                                    scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent`}
                                            >
                                                {colData.map((app, index) => (
                                                    <Draggable key={app.id} draggableId={app.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition group cursor-grab active:cursor-grabbing
                                                                    ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-blue-500/20 z-50' : 'border-slate-200'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wide truncate max-w-[180px]">
                                                                        {app.job.title}
                                                                    </span>
                                                                    {app.isFavorite && <Star size={14} className="text-amber-400 fill-amber-400" />}
                                                                </div>
                                                                
                                                                <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{app.fullName}</h4>
                                                                
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-3">
                                                                    <MapPin size={10} /> {app.job.plantel?.name || 'N/A'}
                                                                </div>

                                                                <div className="flex justify-between items-center border-t border-slate-50 pt-2 mt-2">
                                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                                        {new Date(app.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    <Link 
                                                                        href={`/dashboard/application/${app.id}`}
                                                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition"
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
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}