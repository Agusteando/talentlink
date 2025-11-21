// --- src\app\dashboard\calendar\page.js ---
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MapPin, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }) {
  const session = await auth();
  if (!session || session.user.role === 'CANDIDATE') redirect('/my-applications');

  // Filter logic
  let whereClause = {
    interviewDate: { not: null } // Only scheduled interviews
  };

  if (session.user.role === 'DIRECTOR') {
      if (session.user.plantelId) {
        whereClause.job = { plantelId: session.user.plantelId };
      }
  }

  const interviews = await db.application.findMany({
      where: whereClause,
      include: { job: { include: { plantel: true } } },
      orderBy: { interviewDate: 'asc' }
  });

  // Simple Month Grid Logic
  const today = new Date();
  const currentMonth = today; 
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <div className="p-6 min-h-screen">
       <div className="flex justify-between items-end mb-6">
           <div>
               <h1 className="text-2xl font-bold text-slate-800">Agenda de Entrevistas</h1>
               <p className="text-slate-500">Próximas sesiones programadas</p>
           </div>
           <div className="text-right text-sm font-bold text-slate-400">
               {format(today, 'MMMM yyyy', { locale: es }).toUpperCase()}
           </div>
       </div>

       <div className="grid lg:grid-cols-3 gap-8">
           {/* LIST VIEW (Upcoming) */}
           <div className="lg:col-span-1 space-y-4">
               <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Próximos Eventos</h2>
               {interviews.length === 0 && <div className="text-slate-400 text-sm italic">No hay entrevistas programadas.</div>}
               
               {interviews.map(app => (
                   <Link key={app.id} href={`/dashboard/application/${app.id}`}>
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition hover:border-blue-300 group">
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-50 text-blue-700 rounded-lg p-2 text-center min-w-[60px]">
                                    <span className="block text-xs font-bold uppercase">{format(app.interviewDate, 'MMM', { locale: es })}</span>
                                    <span className="block text-xl font-bold">{format(app.interviewDate, 'd')}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition">{app.fullName}</h3>
                                    <p className="text-xs text-slate-500 font-medium mb-2">{app.job.title}</p>
                                    
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Clock size={10}/> {format(app.interviewDate, 'HH:mm')} hrs</span>
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><MapPin size={10}/> {app.job.plantel.code}</span>
                                    </div>
                                </div>
                            </div>
                       </div>
                   </Link>
               ))}
           </div>

           {/* CALENDAR GRID VIEW */}
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase py-2">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {days.map(day => {
                        const dayInterviews = interviews.filter(i => isSameDay(i.interviewDate, day));
                        return (
                            <div key={day.toString()} className={`min-h-[100px] border rounded-lg p-2 relative ${isToday(day) ? 'bg-blue-50/50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
                                <span className={`text-xs font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className="mt-1 space-y-1">
                                    {dayInterviews.map(i => (
                                        <Link key={i.id} href={`/dashboard/application/${i.id}`} className="block text-[9px] font-bold bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate hover:bg-blue-200 transition">
                                            {format(i.interviewDate, 'HH:mm')} - {i.fullName.split(' ')[0]}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
           </div>
       </div>
    </div>
  );
}