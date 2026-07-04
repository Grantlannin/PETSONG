import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLyricVariants } from '@/lib/claude';
import { generateOneVariant } from '@/lib/generation';
import type { Brief } from '@/lib/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function authed(req: NextRequest): boolean {
  return (
    !!process.env.ADMIN_PASSWORD &&
    req.cookies.get('psa_admin')?.value === process.env.ADMIN_PASSWORD
  );
}

/** Dashboard: re-run Claude + MiniMax for a single variant slot. */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, variant } = await req.json();
    if (!orderId || ![1, 2].includes(variant)) {
      return NextResponse.json({ error: 'orderId and variant (1-2) required' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: order } = await db.from('orders').select('brief').eq('id', orderId).single();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const variants = await generateLyricVariants(order.brief as Brief);
    await generateOneVariant(orderId, variant, variants[variant - 1]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
