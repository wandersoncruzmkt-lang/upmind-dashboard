'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Calendar,
  CheckSquare,
  Users,
  FolderKanban,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/demands', icon: ListTodo, label: 'Demandas' },
  { href: '/demands/new', icon: PlusCircle, label: 'Nova Demanda' },
  { href: '/calendar', icon: Calendar, label: 'Calendário' },
  { href: '/approvals', icon: CheckSquare, label: 'Aprovações' },
  { href: '/team', icon: Users, label: 'Equipe' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dark-secondary border-r border-dark-border flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Upmind</p>
            <p className="text-xs text-gold-premium font-medium">OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'sidebar-item',
                isActive && 'active'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-dark-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-card">
          <FolderKanban className="w-4 h-4 text-gold-premium" />
          <div>
            <p className="text-xs font-medium text-white">Plano Premium</p>
            <p className="text-xs text-gray-500">Demandas ilimitadas</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
