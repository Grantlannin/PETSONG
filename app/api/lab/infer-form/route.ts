import { NextRequest, NextResponse } from 'next/server';
import { inferIntakeForm } from '@/lib/claude';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function authed(req: NextRequest): boolean {
  return (
    !!process.env.ADMIN_PASSWORD &&
    req.cookies.get('psa_admin')?.value === process.env.ADMIN_PASSWORD
  );
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { prompt } = await req.json();
    const fields = await inferIntakeForm(String(prompt ?? ''));
    return NextResponse.json({ fields });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
