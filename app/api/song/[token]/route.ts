import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fullSignedUrl } from '@/lib/generation';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const db = supabaseAdmin();
  const { data: order } = await db
    .from('orders')
    .select('id, status, bundle, selected_variant, brief')
    .eq('delivery_token', params.token)
    .single();

  if (!order || order.status !== 'delivered') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: songs } = await db
    .from('songs')
    .select('variant, arc, title, lyrics, audio_path')
    .eq('order_id', order.id)
    .order('variant');

  const unlocked = (songs || []).filter((s) =>
    order.bundle ? true : s.variant === order.selected_variant
  );

  const withUrls = await Promise.all(
    unlocked.map(async (s) => ({
      variant: s.variant,
      arc: s.arc,
      title: s.title,
      lyrics: s.lyrics,
      download_url: s.audio_path ? await fullSignedUrl(s.audio_path) : null,
    }))
  );

  return NextResponse.json({
    pet_name: (order.brief as { pet_name?: string })?.pet_name,
    bundle: order.bundle,
    songs: withUrls,
  });
}
