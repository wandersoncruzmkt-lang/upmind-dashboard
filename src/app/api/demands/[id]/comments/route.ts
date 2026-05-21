import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/types';

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users!author_id(*)')
    .eq('demand_id', params.id)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { content, is_internal = false, parent_id } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase.from('comments').insert({
    demand_id: params.id,
    author_id: session.user.id,
    content: content.trim(),
    is_internal,
    parent_id: parent_id ?? null,
  }).select('*, author:users!author_id(*)').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
