import { NextRequest, NextResponse } from 'next/server';
import { runGeneration } from '@/lib/generation';

export const maxDuration = 300; // Vercel Pro: allow up to 5 min for 3 MiniMax generations
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    await runGeneration(orderId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
