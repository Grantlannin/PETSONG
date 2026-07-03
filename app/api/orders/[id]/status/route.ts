import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { previewPublicUrl } from '@/lib/generation';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseAdmin();
  const { data: order, error } = await db
    .from('orders')
    .select('id, status, bundle, selected_variant, delivery_token, brief')
    .eq('id', params.id)
    .single();

  if (error || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let songs: unknown[] = [];
  if (order.status === 'preview_ready' || order.status === 'delivered') {
    const { data: rows } = await db
      .from('songs')
      .select('variant, arc, title, lyrics, preview_path')
      .eq('order_id', params.id)
      .order('variant');
    songs = (rows || []).map((s) => ({
      variant: s.variant,
      arc: s.arc,
      title: s.title,
      lyrics: s.lyrics,
      preview_url: s.preview_path ? previewPublicUrl(s.preview_path) : null,
    }));
  }

  return NextResponse.json({
    status: order.status,
    bundle: order.bundle,
    selected_variant: order.selected_variant,
    delivery_token: order.status === 'delivered' ? order.delivery_token : undefined,
    pet_name: (order.brief as { pet_name?: string })?.pet_name,
    songs,
  });
}
