import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (singleton)
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClientComponentClient<Database>();
  }
  return browserClient;
}

// Direct client (for use outside React component tree)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Realtime subscription helpers
export function subscribeToDemandsChannel(
  teamId: string,
  onEvent: (payload: unknown) => void
) {
  return supabase
    .channel(`demands:team:${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'demands',
        filter: `team_id=eq.${teamId}`,
      },
      onEvent
    )
    .subscribe();
}

export function subscribeToCommentsChannel(
  demandId: string,
  onEvent: (payload: unknown) => void
) {
  return supabase
    .channel(`comments:demand:${demandId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `demand_id=eq.${demandId}`,
      },
      onEvent
    )
    .subscribe();
}

export { createServerComponentClient };
export type { Database };
