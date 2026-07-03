import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { orderId, variant } = await req.json();
  if (!orderId || ![1, 2, 3].includes(variant)) {
    return NextResponse.json({ error: 'orderId and variant (1-3) required' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: order } = await db
    .from('orders')
    .select('status, delivery_token')
    .eq('id', orderId)
    .single();
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'preview_ready' && order.status !== 'delivered') {
    return NextResponse.json({ error: `Order not ready (status: ${order.status})` }, { status: 409 });
  }

  const { error } = await db
    .from('orders')
    .update({ selected_variant: variant, status: 'delivered' })
    .eq('id', orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // TODO(resend): send the delivery email with this magic link.
  const link = `${process.env.NEXT_PUBLIC_APP_URL || ''}/song/${order.delivery_token}`;
  return NextResponse.json({ ok: true, link, token: order.delivery_token });
}
