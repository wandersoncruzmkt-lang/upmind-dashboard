import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/types';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const assigned_to = searchParams.get('assigned_to');
  const client_id = searchParams.get('client_id');
  const project_id = searchParams.get('project_id');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('demands')
    .select('*, assignee:users!assigned_to(*), creator:users!created_by(*), client:clients(*), project:projects(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (assigned_to) query = query.eq('assigned_to', assigned_to);
  if (client_id) query = query.eq('client_id', client_id);
  if (project_id) query = query.eq('project_id', project_id);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, pageSize });
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();

  const { data: user } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.team_id) {
    return NextResponse.json({ error: 'Usuário sem equipe' }, { status: 400 });
  }

  const { data, error } = await supabase.from('demands').insert({
    ...body,
    team_id: user.team_id,
    created_by: session.user.id,
    status: 'backlog',
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
