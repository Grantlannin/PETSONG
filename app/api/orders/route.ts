import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Brief } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, brief } = body as { email?: string; brief?: Brief };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!brief?.pet_name || !brief?.pet_type || !brief?.quirks || !brief?.occasion) {
      return NextResponse.json(
        { error: 'Missing required brief fields (pet_name, pet_type, quirks, occasion)' },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from('orders')
      .insert({ email, brief, status: 'pending' })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ orderId: data.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
