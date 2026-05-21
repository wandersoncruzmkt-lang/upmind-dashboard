'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, LayoutGrid, List, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseBrowserClient, subscribeToDemandsChannel } from '@/lib/supabase';
import type { DemandWithRelations, DemandStatus, DemandPriority, User } from '@/lib/types';
import DemandCard from '@/components/DemandCard';
import KanbanBoard from '@/components/KanbanBoard';
import { StatusBadge } from '@/components/StatusBadge';

type ViewMode = 'kanban' | 'list';

const STATUS_OPTIONS: { value: DemandStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'review', label: 'Em Revisão' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function DemandsPage() {
  const [demands, setDemands] = useState<DemandWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('kanban');
  const [statusFilter, setStatusFilter] = useState<DemandStatus | ''>('');
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadDemands();

    const channel = subscribeToDemandsChannel(currentUser.team_id ?? '', () => {
      loadDemands();
    });

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    setCurrentUser(data);
  }

  async function loadDemands() {
    const { data } = await supabase
      .from('demands')
      .select('*, assignee:users!assigned_to(*), creator:users!created_by(*), client:clients(*), project:projects(*)')
      .order('created_at', { ascending: false });
    setDemands((data as DemandWithRelations[]) ?? []);
    setLoading(false);
  }

  function handleDemandUpdate(updated: DemandWithRelations) {
    setDemands((prev) => prev.map((d) => d.id === updated.id ? updated : d));
  }

  const filtered = demands.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Demandas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{demands.length} demandas no total</p>
        </div>
        <Link href="/demands/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Nova Demanda
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-dark-secondary border border-dark-border rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DemandStatus | '')}
          className="input w-auto text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex rounded-lg overflow-hidden border border-dark-border">
          <button
            onClick={() => setView('kanban')}
            className={`p-2 ${view === 'kanban' ? 'bg-blue-accent text-white' : 'bg-dark-secondary text-gray-400 hover:text-white'} transition-colors`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 ${view === 'list' ? 'bg-blue-accent text-white' : 'bg-dark-secondary text-gray-400 hover:text-white'} transition-colors`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-blue-accent border-t-transparent animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard demands={filtered} onDemandUpdate={handleDemandUpdate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-gray-500">Nenhuma demanda encontrada.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
