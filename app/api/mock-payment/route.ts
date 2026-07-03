import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * TODO(stripe): replace this entire file with the real Stripe webhook.
 * This route does exactly what the future checkout.session.completed handler
 * for the BASE product ($37) will do: mark the order paid.
 * (Generation is kicked off by the client calling /api/generate after this
 * returns — in the Stripe version, the webhook can trigger it directly.)
 */
export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const db = supabaseAdmin();
  const { data: order } = await db.from('orders').select('status').eq('id', orderId).single();
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'pending') {
    return NextResponse.json({ ok: true, note: `Already ${order.status}` });
  }

  const { error } = await db.from('orders').update({ status: 'paid' }).eq('id', orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
