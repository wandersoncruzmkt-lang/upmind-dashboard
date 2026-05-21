'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { DemandWithRelations, User } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ApprovalsPage() {
  const [demands, setDemands] = useState<DemandWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [userRes, demandsRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase
        .from('demands')
        .select('*, assignee:users!assigned_to(*), creator:users!created_by(*), client:clients(*)')
        .eq('status', 'review')
        .order('updated_at', { ascending: false }),
    ]);

    setCurrentUser(userRes.data);
    setDemands((demandsRes.data as DemandWithRelations[]) ?? []);
    setLoading(false);
  }

  async function handleAction(demandId: string, action: 'approve' | 'reject') {
    setProcessingId(demandId);
    const newStatus = action === 'approve' ? 'approved' : 'in_progress';

    const { error } = await supabase
      .from('demands')
      .update({ status: newStatus })
      .eq('id', demandId);

    if (error) {
      toast.error('Erro ao processar');
    } else {
      toast.success(action === 'approve' ? 'Demanda aprovada!' : 'Devolvida para revisão');
      setDemands((prev) => prev.filter((d) => d.id !== demandId));
    }
    setProcessingId(null);
  }

  const canApprove = currentUser && ['admin', 'manager'].includes(currentUser.role);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Aprovações</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {demands.length} demanda(s) aguardando aprovação
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-blue-accent border-t-transparent animate-spin" />
        </div>
      ) : demands.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-white font-medium">Tudo aprovado!</p>
          <p className="text-sm text-gray-500 mt-1">Nenhuma demanda pendente de aprovação.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {demands.map((demand) => (
            <div key={demand.id} className="card hover:border-dark-border/80 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <StatusBadge status={demand.status} />
                    <PriorityBadge priority={demand.priority} />
                    {demand.client && (
                      <span className="text-xs text-gray-500">{demand.client.name}</span>
                    )}
                  </div>
                  <Link href={`/demands/${demand.id}`}>
                    <h3 className="text-base font-semibold text-white hover:text-blue-300 transition-colors">
                      {demand.title}
                    </h3>
                  </Link>
                  {demand.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{demand.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {demand.creator && <span>Criado por {demand.creator.full_name}</span>}
                    {demand.assignee && <span>Responsável: {demand.assignee.full_name}</span>}
                  </div>
                </div>

                {canApprove && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(demand.id, 'reject')}
                      disabled={processingId === demand.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 border border-red-700/50 rounded-lg hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {processingId === demand.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <XCircle className="w-3.5 h-3.5" />}
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleAction(demand.id, 'approve')}
                      disabled={processingId === demand.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-400 border border-green-700/50 rounded-lg hover:bg-green-900/20 transition-colors disabled:opacity-50"
                    >
                      {processingId === demand.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle className="w-3.5 h-3.5" />}
                      Aprovar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
