import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/types';

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data, error } = await supabase
    .from('demands')
    .select('*, assignee:users!assigned_to(*), creator:users!created_by(*), client:clients(*), project:projects(*)')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const body = await request.json();
  const { status, title, description, priority, assigned_to, due_date, estimated_hours, tags } = body;

  const updatePayload: Record<string, unknown> = {};
  if (status !== undefined) updatePayload.status = status;
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;
  if (priority !== undefined) updatePayload.priority = priority;
  if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;
  if (due_date !== undefined) updatePayload.due_date = due_date;
  if (estimated_hours !== undefined) updatePayload.estimated_hours = estimated_hours;
  if (tags !== undefined) updatePayload.tags = tags;

  const { data, error } = await supabase
    .from('demands')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { error } = await supabase.from('demands').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
