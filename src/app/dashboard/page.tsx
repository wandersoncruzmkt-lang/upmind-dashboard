import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ListTodo, Clock, CheckCircle, AlertTriangle, ArrowRight, PlusCircle } from 'lucide-react';
import type { Database, DemandWithRelations } from '@/lib/types';
import DemandCard from '@/components/DemandCard';

async function getDashboardData(userId: string, supabase: ReturnType<typeof createServerComponentClient<Database>>) {
  const [demandsRes, myDemandsRes] = await Promise.all([
    supabase
      .from('demands')
      .select('*, assignee:users!assigned_to(*), creator:users!created_by(*), client:clients(*), project:projects(*)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('demands')
      .select('id, status')
      .eq('assigned_to', userId),
  ]);

  return {
    demands: (demandsRes.data ?? []) as DemandWithRelations[],
    myDemands: myDemandsRes.data ?? [],
  };
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { demands, myDemands } = await getDashboardData(session.user.id, supabase);

  const stats = {
    total: demands.length,
    inProgress: demands.filter((d) => d.status === 'in_progress').length,
    review: demands.filter((d) => d.status === 'review').length,
    overdue: demands.filter((d) =>
      d.due_date && new Date(d.due_date) < new Date() &&
      !['delivered', 'cancelled'].includes(d.status)
    ).length,
  };

  const recentDemands = demands.slice(0, 6);
  const urgentDemands = demands.filter((d) => d.priority === 'urgent' && d.status !== 'delivered').slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral das operações</p>
        </div>
        <Link href="/demands/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Demanda
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: ListTodo, color: 'text-blue-400' },
          { label: 'Em Andamento', value: stats.inProgress, icon: Clock, color: 'text-yellow-400' },
          { label: 'Em Revisão', value: stats.review, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Atrasadas', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent demands */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Demandas Recentes</h2>
            <Link href="/demands" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentDemands.map((demand) => (
              <DemandCard key={demand.id} demand={demand} />
            ))}
          </div>
        </div>

        {/* Urgent */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Urgentes</h2>
          <div className="space-y-3">
            {urgentDemands.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">Nenhuma urgente!</p>
              </div>
            ) : (
              urgentDemands.map((demand) => (
                <DemandCard key={demand.id} demand={demand} compact />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
