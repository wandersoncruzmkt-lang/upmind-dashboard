'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Demand } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [demands, setDemands] = useState<Demand[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadDemands();
  }, [currentDate]);

  async function loadDemands() {
    const start = startOfMonth(currentDate).toISOString().slice(0, 10);
    const end = endOfMonth(currentDate).toISOString().slice(0, 10);

    const { data } = await supabase
      .from('demands')
      .select('id, title, due_date, status, priority')
      .gte('due_date', start)
      .lte('due_date', end)
      .not('due_date', 'is', null);

    setDemands((data as Demand[]) ?? []);
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getDayDemands = (day: Date) =>
    demands.filter((d) => d.due_date && isSameDay(new Date(d.due_date + 'T00:00:00'), day));

  const selectedDemands = selectedDay ? getDayDemands(selectedDay) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendário</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-secondary rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-dark-border rounded-xl overflow-hidden">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="bg-dark-secondary px-3 py-2 text-xs text-gray-500 font-medium text-center">{d}</div>
        ))}
        {days.map((day) => {
          const dayDemands = getDayDemands(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
              className={clsx(
                'bg-dark-bg min-h-[80px] p-2 text-left transition-colors hover:bg-dark-secondary/50',
                !isCurrentMonth && 'opacity-30',
                isSelected && 'ring-inset ring-2 ring-blue-accent'
              )}
            >
              <span className={clsx(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                isToday(day) ? 'bg-gold-premium text-dark-bg' : 'text-gray-400'
              )}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayDemands.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className={clsx(
                      'text-xs px-1 py-0.5 rounded truncate',
                      d.priority === 'urgent' ? 'bg-red-900/60 text-red-300' :
                      d.priority === 'high' ? 'bg-orange-900/60 text-orange-300' :
                      'bg-blue-900/40 text-blue-300'
                    )}
                  >
                    {d.title}
                  </div>
                ))}
                {dayDemands.length > 3 && (
                  <p className="text-xs text-gray-500">+{dayDemands.length - 3} mais</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div className="card animate-slide-up">
          <h3 className="text-base font-semibold text-white mb-4">
            {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })} &mdash; {selectedDemands.length} demanda(s)
          </h3>
          {selectedDemands.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma demanda com prazo neste dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedDemands.map((d) => (
                <Link
                  key={d.id}
                  href={`/demands/${d.id}`}
                  className="flex items-center justify-between p-3 bg-dark-secondary rounded-lg hover:bg-dark-card transition-colors"
                >
                  <span className="text-sm text-white">{d.title}</span>
                  <StatusBadge status={d.status} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
