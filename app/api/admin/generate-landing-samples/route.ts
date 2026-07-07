import { NextRequest, NextResponse } from 'next/server';
import { generateLandingSamples } from '@/lib/generate-landing-samples';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function authed(req: NextRequest): boolean {
  return (
    !!process.env.ADMIN_PASSWORD &&
    req.cookies.get('psa_admin')?.value === process.env.ADMIN_PASSWORD
  );
}

/** Admin: generate POP / Jazz / 80's rock 10s landing demos → Supabase songs-previews/landing/ */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const results = await generateLandingSamples();
    return NextResponse.json({ ok: true, samples: results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
