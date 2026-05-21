'use client';

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import DemandCard from './DemandCard';
import { StatusBadge } from './StatusBadge';
import type { DemandWithRelations, DemandStatus } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

const COLUMNS: { status: DemandStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'in_progress', label: 'Em Andamento' },
  { status: 'review', label: 'Em Revisão' },
  { status: 'approved', label: 'Aprovado' },
  { status: 'delivered', label: 'Entregue' },
];

interface KanbanBoardProps {
  demands: DemandWithRelations[];
  onDemandUpdate?: (updated: DemandWithRelations) => void;
}

export default function KanbanBoard({ demands, onDemandUpdate }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<DemandStatus | null>(null);
  const supabase = getSupabaseBrowserClient();

  const getDemandsByStatus = (status: DemandStatus) =>
    demands.filter((d) => d.status === status);

  const handleDragStart = useCallback((e: React.DragEvent, demandId: string) => {
    e.dataTransfer.setData('demandId', demandId);
    setDraggingId(demandId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: DemandStatus) => {
    e.preventDefault();
    setDragOverStatus(status);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: DemandStatus) => {
    e.preventDefault();
    const demandId = e.dataTransfer.getData('demandId');
    const demand = demands.find((d) => d.id === demandId);

    if (!demand || demand.status === newStatus) {
      setDraggingId(null);
      setDragOverStatus(null);
      return;
    }

    const { error } = await supabase
      .from('demands')
      .update({ status: newStatus })
      .eq('id', demandId);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado!');
      onDemandUpdate?.({ ...demand, status: newStatus });
    }

    setDraggingId(null);
    setDragOverStatus(null);
  }, [demands, supabase, onDemandUpdate]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
      {COLUMNS.map(({ status, label }) => {
        const columnDemands = getDemandsByStatus(status);
        const isOver = dragOverStatus === status;

        return (
          <div
            key={status}
            className={`flex flex-col w-72 shrink-0 rounded-xl transition-colors duration-200 ${
              isOver ? 'bg-dark-secondary/80 ring-1 ring-blue-accent' : 'bg-dark-secondary/40'
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            onDragLeave={() => setDragOverStatus(null)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} size="sm" />
                <span className="text-xs text-gray-500 font-medium">{columnDemands.length}</span>
              </div>
              <button className="p-1 text-gray-500 hover:text-white transition-colors rounded">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {columnDemands.map((demand) => (
                <div
                  key={demand.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, demand.id)}
                  className={`transition-opacity duration-150 ${
                    draggingId === demand.id ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <DemandCard demand={demand} draggable compact />
                </div>
              ))}

              {columnDemands.length === 0 && (
                <div className="flex items-center justify-center h-24 border border-dashed border-dark-border rounded-lg">
                  <p className="text-xs text-gray-600">Arraste aqui</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
