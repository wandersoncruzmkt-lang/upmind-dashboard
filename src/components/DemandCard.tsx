'use client';

import { MessageSquare, Paperclip, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { clsx } from 'clsx';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import type { DemandWithRelations } from '@/lib/types';

const TYPE_ICONS: Record<string, string> = {
  design: '🎨',
  copy: '✍️',
  video: '🎬',
  social: '📱',
  task: '✅',
  other: '📦',
};

interface DemandCardProps {
  demand: DemandWithRelations;
  draggable?: boolean;
  compact?: boolean;
}

export default function DemandCard({ demand, draggable = false, compact = false }: DemandCardProps) {
  const isOverdue =
    demand.due_date &&
    demand.status !== 'delivered' &&
    demand.status !== 'cancelled' &&
    new Date(demand.due_date) < new Date();

  return (
    <Link href={`/demands/${demand.id}`}>
      <div
        className={clsx(
          'card hover:border-blue-accent/50 transition-all duration-200 cursor-pointer group',
          draggable && 'active:scale-95',
          compact ? 'p-3' : 'p-4'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{TYPE_ICONS[demand.type]}</span>
            <span className="text-xs text-gray-500 capitalize">{demand.type}</span>
          </div>
          <PriorityBadge priority={demand.priority} size="sm" />
        </div>

        {/* Title */}
        <h3 className={clsx(
          'font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2',
          compact ? 'text-sm' : 'text-sm'
        )}>
          {demand.title}
        </h3>

        {/* Client/Project */}
        {(demand.client || demand.project) && !compact && (
          <p className="text-xs text-gray-500 mb-3 truncate">
            {demand.client?.name}{demand.client && demand.project && ' · '}{demand.project?.name}
          </p>
        )}

        {/* Tags */}
        {demand.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {demand.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-dark-bg rounded text-gray-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border">
          <div className="flex items-center gap-3">
            {typeof demand.comments_count === 'number' && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare className="w-3 h-3" />
                {demand.comments_count}
              </span>
            )}
            {typeof demand.files_count === 'number' && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Paperclip className="w-3 h-3" />
                {demand.files_count}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {demand.due_date && (
              <span className={clsx(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-red-400' : 'text-gray-500'
              )}>
                <Calendar className="w-3 h-3" />
                {format(new Date(demand.due_date), 'dd/MM', { locale: ptBR })}
              </span>
            )}
            {demand.assignee ? (
              <div
                className="w-6 h-6 rounded-full bg-blue-accent flex items-center justify-center text-xs font-semibold text-white"
                title={demand.assignee.full_name}
              >
                {demand.assignee.full_name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-dashed border-dark-border flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
