import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { previewPublicUrl } from '@/lib/generation';

export const dynamic = 'force-dynamic';

function authed(req: NextRequest): boolean {
  return (
    !!process.env.ADMIN_PASSWORD &&
    req.cookies.get('psa_admin')?.value === process.env.ADMIN_PASSWORD
  );
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: orders } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const ids = (orders || []).map((o) => o.id);
  const { data: songs } = ids.length
    ? await db.from('songs').select('*').in('order_id', ids).order('variant')
    : { data: [] };

  const songsByOrder: Record<string, unknown[]> = {};
  for (const s of songs || []) {
    const arr = (songsByOrder[s.order_id] = songsByOrder[s.order_id] || []);
    arr.push({
      variant: s.variant,
      arc: s.arc,
      title: s.title,
      lyrics: s.lyrics,
      style_prompt: s.style_prompt,
      preview_url: s.preview_path ? previewPublicUrl(s.preview_path) : null,
    });
  }

  const paidStatuses = ['paid', 'generating', 'preview_ready', 'delivered'];
  const stats = {
    total: (orders || []).length,
    paid: (orders || []).filter((o) => paidStatuses.includes(o.status)).length,
    delivered: (orders || []).filter((o) => o.status === 'delivered').length,
    bundles: (orders || []).filter((o) => o.bundle).length,
    revenue: (orders || []).reduce((sum, o) => {
      if (!paidStatuses.includes(o.status)) return sum;
      return sum + 37 + (o.bundle ? 10 : 0);
    }, 0),
  };

  return NextResponse.json({
    stats,
    orders: (orders || []).map((o) => ({ ...o, songs: songsByOrder[o.id] || [] })),
  });
}
