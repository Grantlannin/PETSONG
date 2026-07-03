import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runGeneration } from '@/lib/generation';
import { SAMPLE_BRIEF } from '@/lib/sample-brief';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/** Dev only: create a paid order with the sample brief and run the full pipeline. */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('orders')
    .insert({ email: 'dev@test.local', brief: SAMPLE_BRIEF, status: 'paid' })
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'insert failed' }, { status: 500 });
  }

  try {
    await runGeneration(data.id);
    return NextResponse.json({ ok: true, orderId: data.id, previewUrl: `/preview/${data.id}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg, orderId: data.id }, { status: 500 });
  }
}
