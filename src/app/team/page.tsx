'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Users } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { User, UserRole } from '@/lib/types';
import { clsx } from 'clsx';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-gold-premium/20 text-gold-premium border border-gold-premium/30' },
  manager: { label: 'Gerente', color: 'bg-blue-900/40 text-blue-300 border border-blue-700/40' },
  member: { label: 'Membro', color: 'bg-dark-card text-gray-300 border border-dark-border' },
  client: { label: 'Cliente', color: 'bg-purple-900/40 text-purple-300 border border-purple-700/40' },
};

export default function TeamPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: me } = await supabase.from('users').select('*').eq('id', user.id).single();
    setCurrentUser(me);

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('team_id', me?.team_id)
      .order('full_name');

    setMembers(data ?? []);
    setLoading(false);
  }

  const isAdmin = currentUser?.role === 'admin';

  const grouped = {
    admin: members.filter((m) => m.role === 'admin'),
    manager: members.filter((m) => m.role === 'manager'),
    member: members.filter((m) => m.role === 'member'),
    client: members.filter((m) => m.role === 'client'),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} membros</p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Convidar Membro
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(grouped) as [UserRole, User[]][]).map(([role, list]) => {
          const config = ROLE_CONFIG[role];
          return (
            <div key={role} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className={clsx('badge text-xs', config.color)}>{config.label}</span>
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-white">{list.length}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-blue-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(grouped) as [UserRole, User[]][]).map(([role, list]) => {
            if (list.length === 0) return null;
            const config = ROLE_CONFIG[role];
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className={clsx('badge text-xs', config.color)}>{config.label}s</span>
                  <span className="text-xs text-gray-500">({list.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {list.map((member) => (
                    <div key={member.id} className="card flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-accent flex items-center justify-center text-base font-bold text-white shrink-0">
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {member.full_name}
                          {member.id === currentUser?.id && (
                            <span className="ml-1 text-xs text-gray-500">(você)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3 h-3 shrink-0" />
                          {member.email}
                        </p>
                      </div>
                      <div className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        member.is_active ? 'bg-green-500' : 'bg-gray-600'
                      )} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
