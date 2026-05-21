'use client';

import { useState } from 'react';
import { Bell, Search, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { User as UserType } from '@/lib/types';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: UserType;
}

export default function Header({ user }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success('Até logo!');
    router.push('/auth/login');
  }

  return (
    <header className="h-16 bg-dark-secondary border-b border-dark-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar demandas, clientes..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-gold-premium rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-card transition-colors"
          >
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-accent flex items-center justify-center text-sm font-semibold">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-white leading-none">{user.full_name}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{user.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-dark-card border border-dark-border rounded-xl shadow-xl z-50 animate-fade-in">
              <div className="p-3 border-b border-dark-border">
                <p className="text-sm font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { router.push('/profile'); setDropdownOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-secondary rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </button>
                <button
                  onClick={() => { router.push('/settings'); setDropdownOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-secondary rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                <div className="my-1 border-t border-dark-border" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-secondary rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
