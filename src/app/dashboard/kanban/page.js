// --- src\app\dashboard\kanban\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import { PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.VIEW_CANDIDATES)) {
      redirect('/dashboard');
  }

  // 1:N FILTER
  let whereClause = {};
  
  if (!session.user.isGlobal) {
      const ids = session.user.plantelIds || [];
      if (ids.length > 0) {
          whereClause = { job: { plantelId: { in: ids } } };
      } else {
          whereClause = { id: 'none' };
      }
  }

  const applications = await db.application.findMany({
      where: whereClause,
      include: { 
          job: { 
              include: { 
                  plantel: true,
                  jobTitle: true 
              } 
          }, 
          user: true 
      },
      orderBy: { createdAt: 'desc' }
  });

  const [plantels, jobTitles] = await Promise.all([
      db.plantel.findMany({ 
          where: { isActive: true }, 
          orderBy: { name: 'asc' } 
      }),
      db.jobTitle.findMany({ 
          where: { isActive: true }, 
          orderBy: { name: 'asc' } 
      })
  ]);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
       <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <h1 className="text-2xl font-bold text-slate-800">Tablero de Seguimiento</h1>
          <p className="text-slate-500 text-sm">Gestión visual del flujo de candidatos.</p>
       </div>
       
       <KanbanBoard 
            initialData={applications} 
            plantels={plantels}
            jobTitles={jobTitles}
       />
    </div>
  );
}