// --- src\app\dashboard\kanban\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import KanbanBoard from '@/components/dashboard/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
  const session = await auth();
  if (!session || session.user.role === 'CANDIDATE') redirect('/my-applications');

  // Filter logic same as dashboard
  let whereClause = {};
  if (session.user.role === 'DIRECTOR') {
      whereClause = session.user.plantelId ? { job: { plantelId: session.user.plantelId } } : { id: 'none' };
  }

  const applications = await db.application.findMany({
      where: whereClause,
      include: { job: true, user: true },
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="h-[calc(100vh-100px)]">
       <div className="mb-4 px-2">
          <h1 className="text-2xl font-bold text-slate-800">Tablero de Seguimiento</h1>
          <p className="text-slate-500 text-sm">Arrastra y suelta los candidatos para cambiar su estado.</p>
       </div>
       <KanbanBoard initialData={applications} />
    </div>
  );
}