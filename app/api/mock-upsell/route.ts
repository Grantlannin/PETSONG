import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * TODO(stripe): replace with the real +$10 "unlock all 3" checkout + webhook.
 * This does what that webhook will do: flip bundle=true.
 */
export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from('orders').update({ bundle: true }).eq('id', orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
