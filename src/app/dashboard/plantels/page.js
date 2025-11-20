// --- src\app\dashboard\plantels\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PlantelList from '@/components/dashboard/plantels/PlantelList';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function PlantelsPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  // Fetch data server-side
  const plantels = await db.plantel.findMany({ 
      orderBy: { name: 'asc' },
      include: {
          _count: {
              select: { jobs: true, users: true }
          }
      }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header Area */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="rounded-full bg-white p-2.5 shadow-sm hover:bg-slate-100 transition border border-slate-200">
                <ArrowLeft size={20} className="text-slate-600"/>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Infraestructura & Planteles</h1>
                <p className="text-sm text-slate-500">Administra las ubicaciones físicas y sedes de la institución.</p>
            </div>
        </div>

        {/* Interactive Client Component */}
        <PlantelList initialData={plantels} />
      </div>
    </div>
  );
}