import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/types';

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: files, error } = await supabase
    .from('files')
    .select('*, uploader:users!uploaded_by(*)')
    .eq('demand_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs
  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (file) => {
      const { data } = await supabase.storage
        .from('demand-files')
        .createSignedUrl(file.storage_path, 3600);
      return { ...file, url: data?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ data: filesWithUrls });
}

export async function DELETE(request: Request, { params }: Params) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { fileId } = await request.json();

  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .eq('demand_id', params.id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  await supabase.storage.from('demand-files').remove([file.storage_path]);

  const { error } = await supabase.from('files').delete().eq('id', fileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
