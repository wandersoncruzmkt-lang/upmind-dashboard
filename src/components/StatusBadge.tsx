import { clsx } from 'clsx';
import type { DemandStatus, DemandPriority } from '@/lib/types';

const STATUS_CONFIG: Record<DemandStatus, { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'bg-gray-800 text-gray-300' },
  in_progress: { label: 'Em Andamento', className: 'bg-blue-900/60 text-blue-300 border border-blue-700' },
  review: { label: 'Em Revisão', className: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700' },
  approved: { label: 'Aprovado', className: 'bg-green-900/60 text-green-300 border border-green-700' },
  delivered: { label: 'Entregue', className: 'bg-gold-premium/20 text-gold-premium border border-gold-premium/30' },
  cancelled: { label: 'Cancelado', className: 'bg-red-900/40 text-red-400 border border-red-700/50' },
};

const PRIORITY_CONFIG: Record<DemandPriority, { label: string; className: string; dot: string }> = {
  low: { label: 'Baixa', className: 'bg-gray-800 text-gray-400', dot: 'bg-gray-500' },
  medium: { label: 'Média', className: 'bg-blue-900/40 text-blue-400', dot: 'bg-blue-500' },
  high: { label: 'Alta', className: 'bg-orange-900/40 text-orange-400', dot: 'bg-orange-500' },
  urgent: { label: 'Urgente', className: 'bg-red-900/40 text-red-400', dot: 'bg-red-500' },
};

interface StatusBadgeProps {
  status: DemandStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={clsx(
      'badge font-medium',
      config.className,
      size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
    )}>
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: DemandPriority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={clsx(
      'badge font-medium gap-1.5',
      config.className,
      size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
