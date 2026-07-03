import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSong } from '@/lib/minimax';
import { randomUUID } from 'crypto';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function authed(req: NextRequest): boolean {
  return (
    !!process.env.ADMIN_PASSWORD &&
    req.cookies.get('psa_admin')?.value === process.env.ADMIN_PASSWORD
  );
}

/** Lab: sing one lyric variant. Full song, uploaded to the public previews
 * bucket under lab/ so it can play immediately without signed URLs. */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { style_prompt, lyrics } = await req.json();
    if (!style_prompt || !lyrics) {
      return NextResponse.json({ error: 'style_prompt and lyrics required' }, { status: 400 });
    }

    const mp3 = await generateSong({ stylePrompt: style_prompt, lyrics });

    const db = supabaseAdmin();
    const path = `lab/${randomUUID()}.mp3`;
    const up = await db.storage
      .from('songs-previews')
      .upload(path, mp3, { contentType: 'audio/mpeg', upsert: true });
    if (up.error) throw new Error(up.error.message);

    const url = db.storage.from('songs-previews').getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
