'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Vinyl } from '@/lib/vinyl';

interface PreviewSong {
  variant: number;
  arc: string | null;
  title: string | null;
  lyrics: string | null;
  preview_url: string | null;
}

interface StatusPayload {
  status: string;
  bundle: boolean;
  selected_variant: number | null;
  delivery_token?: string;
  pet_name?: string;
  songs: PreviewSong[];
}

const ARC_LABELS: Record<string, string> = {
  funny: 'The Funny One',
  heartfelt: 'The Heartfelt One',
};

const LOADING_LINES = [
  (n: string) => `Writing ${n}'s verses…`,
  (n: string) => `Teaching the band ${n}'s name…`,
  (n: string) => `Recording take one of ${n}'s chorus…`,
  (n: string) => `Getting the zoomies into verse two…`,
  (n: string) => `Mixing ${n}'s two songs…`,
];

export default function PreviewPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [data, setData] = useState<StatusPayload | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [openLyrics, setOpenLyrics] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
      if (!res.ok) return;
      const json: StatusPayload = await res.json();
      setData(json);
      if (json.status === 'preview_ready' || json.status === 'delivered' || json.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      /* keep polling */
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 4000);
    const rotator = setInterval(() => setLineIdx((i) => i + 1), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(rotator);
    };
  }, [fetchStatus]);

  async function choose(variant: number) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, variant }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not select song');
      router.push(`/song/${json.token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(false);
    }
  }

  async function unlockAll() {
    setBusy(true);
    setError('');
    try {
      // TODO(stripe): real +$10 upsell checkout goes here.
      const res = await fetch('/api/mock-upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Upgrade failed');
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const petName = data?.pet_name || 'your pet';
  const generating = !data || ['pending', 'paid', 'generating'].includes(data.status);

  if (data?.status === 'failed') {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-black">The studio hit a snag.</h1>
        <p className="mt-4 text-ink/70">
          Something went wrong while recording {petName}&apos;s songs. Nothing was lost — try again
          from the dashboard, or contact support and we&apos;ll make it right.
        </p>
      </main>
    );
  }

  if (generating) {
    const line = LOADING_LINES[lineIdx % LOADING_LINES.length](petName);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Vinyl size={140} spinning />
        <h1 className="mt-8 font-display text-3xl font-black">{line}</h1>
        <p className="mt-3 text-ink/60">Usually takes about 2 minutes. Don&apos;t close this page.</p>
      </main>
    );
  }

  const canChooseFree = data!.status === 'preview_ready' && !data!.bundle;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-2 flex items-center gap-3">
        <Vinyl size={44} />
        <h1 className="font-display text-3xl font-black">{petName}&apos;s two songs</h1>
      </div>
      <p className="mb-8 text-ink/70">
        45-second previews below.{' '}
        {data!.bundle
          ? 'You unlocked both — pick any to continue to your downloads.'
          : 'Pick the one you love (included), or unlock both.'}
      </p>

      {!data!.bundle && (
        <div className="mb-8 flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-tennisdark bg-tennis/30 px-5 py-4 sm:flex-row">
          <p className="font-semibold">Can&apos;t decide? Keep both songs.</p>
          <button className="btn-tennis" onClick={unlockAll} disabled={busy}>
            Unlock both — +$10 (TEST MODE)
          </button>
        </div>
      )}

      <div className="space-y-6">
        {data!.songs.map((s) => (
          <div key={s.variant} className="rounded-3xl border-2 border-ink/10 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="hidden shrink-0 sm:block">
                <Vinyl size={88} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs uppercase tracking-widest text-grass">
                  {ARC_LABELS[s.arc || ''] || `Song ${s.variant}`}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold">{s.title || `Song ${s.variant}`}</h2>
                {s.preview_url ? (
                  <audio className="mt-4 w-full" controls preload="none" src={s.preview_url} />
                ) : (
                  <p className="mt-4 text-sm text-ink/50">Preview unavailable for this one.</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    className="btn-primary"
                    onClick={() => choose(s.variant)}
                    disabled={busy || !!(data!.selected_variant && !data!.bundle)}
                  >
                    {data!.bundle ? 'Continue with this one' : canChooseFree ? 'Choose this one' : 'Chosen'}
                  </button>
                  <button
                    className="text-sm font-semibold text-grass underline"
                    onClick={() => setOpenLyrics(openLyrics === s.variant ? null : s.variant)}
                  >
                    {openLyrics === s.variant ? 'Hide lyrics' : 'Read lyrics'}
                  </button>
                </div>
                {openLyrics === s.variant && s.lyrics && (
                  <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-paper p-4 font-body text-sm text-ink/80">
                    {s.lyrics}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </main>
  );
}
