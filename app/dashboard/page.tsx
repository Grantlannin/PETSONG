'use client';

import { useEffect, useState } from 'react';
import type { OrderRow } from '@/lib/types';

interface DashSong {
  variant: number;
  arc: string | null;
  title: string | null;
  lyrics: string | null;
  style_prompt: string | null;
  preview_url: string | null;
}
type DashOrder = OrderRow & { songs: DashSong[] };
interface DashData {
  stats: { total: number; paid: number; delivered: number; bundles: number; revenue: number };
  orders: DashOrder[];
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<DashData | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busyRegen, setBusyRegen] = useState<string>('');
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/dashboard/data', { cache: 'no-store' });
    if (res.status === 401) return setAuthed(false);
    setAuthed(true);
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function login() {
    setError('');
    const res = await fetch('/api/dashboard/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return setError('Wrong password');
    await load();
  }

  async function regenerate(orderId: string, variant: number) {
    setBusyRegen(`${orderId}-${variant}`);
    setError('');
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, variant }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Regenerate failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regenerate failed');
    } finally {
      setBusyRegen('');
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <h1 className="font-display text-2xl font-black">Dashboard</h1>
        <input
          type="password"
          className="field mt-6"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()}
        />
        <button className="btn-primary mt-4 w-full" onClick={login}>
          Sign in
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  if (!data) return <main className="p-12 font-mono text-sm">Loading…</main>;

  const stat = (label: string, value: string | number) => (
    <div className="rounded-2xl border-2 border-ink/10 bg-white px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50">{label}</p>
      <p className="font-display text-3xl font-black">{value}</p>
    </div>
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-black">Orders</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stat('Orders', data.stats.total)}
        {stat('Paid', data.stats.paid)}
        {stat('Delivered', data.stats.delivered)}
        {stat('Bundles', data.stats.bundles)}
        {stat('Revenue', `$${data.stats.revenue}`)}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 space-y-3">
        {data.orders.map((o) => (
          <div key={o.id} className="rounded-2xl border-2 border-ink/10 bg-white">
            <button
              className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-4 text-left"
              onClick={() => setOpen(open === o.id ? null : o.id)}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-lg font-bold">{o.brief?.pet_name || '—'}</span>
                <span className="text-sm text-ink/60">{o.email}</span>
                {o.bundle && (
                  <span className="rounded-full bg-tennis px-2 py-0.5 font-mono text-xs">bundle</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 font-mono text-xs ${
                    o.status === 'delivered'
                      ? 'bg-grass text-paper'
                      : o.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blush'
                  }`}
                >
                  {o.status}
                </span>
                <span className="font-mono text-xs text-ink/40">
                  {new Date(o.created_at).toLocaleString()}
                </span>
              </div>
            </button>

            {open === o.id && (
              <div className="border-t-2 border-ink/10 px-5 py-4">
                <pre className="mb-4 whitespace-pre-wrap rounded-xl bg-paper p-4 font-mono text-xs">
                  {JSON.stringify(o.brief, null, 2)}
                </pre>
                {o.error && <p className="mb-4 text-sm text-red-600">Error: {o.error}</p>}
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((v) => {
                    const s = o.songs.find((x) => x.variant === v);
                    const key = `${o.id}-${v}`;
                    return (
                      <div key={v} className="rounded-xl border border-ink/10 p-4">
                        <p className="font-mono text-xs uppercase text-grass">
                          {s?.arc || `variant ${v}`}
                        </p>
                        <p className="mt-1 font-semibold">{s?.title || '—'}</p>
                        {s?.preview_url && (
                          <audio className="mt-2 w-full" controls preload="none" src={s.preview_url} />
                        )}
                        {s?.style_prompt && (
                          <p className="mt-2 font-mono text-xs text-ink/50">{s.style_prompt}</p>
                        )}
                        {s?.lyrics && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-semibold text-grass">
                              lyrics
                            </summary>
                            <pre className="mt-1 whitespace-pre-wrap text-xs text-ink/70">{s.lyrics}</pre>
                          </details>
                        )}
                        <button
                          className="btn-tennis mt-3 w-full !py-2 text-sm"
                          onClick={() => regenerate(o.id, v)}
                          disabled={busyRegen === key}
                        >
                          {busyRegen === key ? 'Regenerating…' : `Regenerate ${v}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
