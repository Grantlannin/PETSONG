'use client';

import { useEffect, useState } from 'react';
import { LYRICS_SYSTEM_PROMPT } from '@/lib/lyrics-prompt';
import type { SongVariant } from '@/lib/types';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  sample: string;
  required: boolean;
}

interface SingState {
  status: 'idle' | 'singing' | 'done' | 'error';
  url?: string;
  error?: string;
}

function lint(v: SongVariant, petName: string) {
  const lines = v.lyrics.split('\n').filter((l) => l.trim() && !l.trim().startsWith('['));
  const name = (petName || '').trim().toLowerCase();
  const nameCount = name
    ? (v.lyrics.toLowerCase().match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    : 0;
  const first2 = lines.slice(0, 2).join(' ').toLowerCase();
  return {
    lineCount: lines.length,
    nameCount,
    nameEarly: name ? first2.includes(name) : false,
  };
}

export default function LabPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [prompt, setPrompt] = useState(LYRICS_SYSTEM_PROMPT.trim());
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<SongVariant[]>([]);
  const [sing, setSing] = useState<Record<number, SingState>>({});
  const [busyForm, setBusyForm] = useState(false);
  const [busyLyrics, setBusyLyrics] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/data', { cache: 'no-store' }).then((r) => setAuthed(r.status !== 401));
  }, []);

  async function login() {
    const res = await fetch('/api/dashboard/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setError('Wrong password');
  }

  async function buildForm() {
    setBusyForm(true);
    setError('');
    try {
      const res = await fetch('/api/lab/infer-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Form inference failed');
      setFields(json.fields);
      setValues({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyForm(false);
    }
  }

  function fillSamples() {
    const v: Record<string, string> = {};
    for (const f of fields) v[f.key] = f.sample || '';
    setValues(v);
  }

  async function writeLyrics() {
    setBusyLyrics(true);
    setError('');
    setVariants([]);
    setSing({});
    try {
      const res = await fetch('/api/lab/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, brief: values }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lyric generation failed');
      setVariants(json.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyLyrics(false);
    }
  }

  async function singVariant(i: number) {
    const v = variants[i];
    if (!v) return;
    setSing((s) => ({ ...s, [i]: { status: 'singing' } }));
    try {
      const res = await fetch('/api/lab/sing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style_prompt: v.style_prompt, lyrics: v.lyrics }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sing failed');
      setSing((s) => ({ ...s, [i]: { status: 'done', url: json.url } }));
    } catch (e) {
      setSing((s) => ({
        ...s,
        [i]: { status: 'error', error: e instanceof Error ? e.message : 'Failed' },
      }));
    }
  }

  const petName =
    values.pet_name || values.name || values.dog_name || values.cat_name || '';

  if (authed === null) return <main className="p-12 font-mono text-sm">Loading…</main>;

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <h1 className="font-display text-2xl font-black">Prompt lab</h1>
        <input type="password" className="field mt-6" placeholder="Admin password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()} />
        <button className="btn-primary mt-4 w-full" onClick={login}>Sign in</button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
        <h1 className="font-display text-2xl font-black">Prompt lab</h1>
        <p className="font-mono text-xs text-ink/50">
          form ← prompt → lyrics → song · when a prompt wins, paste it into lib/lyrics-prompt.ts
        </p>
      </div>

      {error && <p className="mx-2 mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">1 · Intake</h2>
            <button className="btn-tennis !px-3 !py-1.5 text-xs" onClick={buildForm} disabled={busyForm}>
              {busyForm ? 'Inferring…' : fields.length ? 'Re-infer from prompt' : 'Infer form from prompt'}
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-ink/50">
              No form yet. Click <span className="font-semibold">Infer form from prompt</span> and
              Claude will read your prompt and build the intake fields it needs.
            </p>
          ) : (
            <div className="space-y-3">
              <button className="w-full rounded-lg border-2 border-dashed border-ink/20 py-1.5 text-xs font-semibold text-ink/60 hover:border-grass hover:text-grass"
                onClick={fillSamples}>
                Fill with sample values
              </button>
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="label !mb-1 !text-xs" htmlFor={`lab-${f.key}`}>
                    {f.label}{f.required && ' *'}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea id={`lab-${f.key}`} className="field !px-3 !py-2 text-sm min-h-20"
                      placeholder={f.placeholder}
                      value={values[f.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                  ) : f.type === 'select' ? (
                    <select id={`lab-${f.key}`} className="field !px-3 !py-2 text-sm"
                      value={values[f.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}>
                      <option value="">—</option>
                      {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={`lab-${f.key}`} className="field !px-3 !py-2 text-sm"
                      placeholder={f.placeholder}
                      value={values[f.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">2 · Prompt</h2>
            <button className="btn-primary !px-4 !py-1.5 text-xs" onClick={writeLyrics}
              disabled={busyLyrics || fields.length === 0}>
              {busyLyrics ? 'Writing…' : 'Write lyrics →'}
            </button>
          </div>
          <textarea
            className="field min-h-[60vh] font-mono !text-xs leading-relaxed"
            placeholder="Your songwriting system prompt. Structure, line budgets, syllable rules, name placement, banned words, arc definitions, style-prompt direction…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <p className="hint">
            Edits here run live — production still reads lib/lyrics-prompt.ts. The JSON output
            contract is appended automatically; don&apos;t restate it.
          </p>
        </section>

        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-4">
          <h2 className="mb-3 font-display text-lg font-bold">3 · Lyrics</h2>
          {busyLyrics && <p className="text-sm text-ink/50">Claude is writing… ~5s</p>}
          {!busyLyrics && variants.length === 0 && (
            <p className="text-sm text-ink/50">Fill the intake, then hit Write lyrics.</p>
          )}
          <div className="space-y-4">
            {variants.map((v, i) => {
              const l = lint(v, petName);
              return (
                <div key={i} className="rounded-xl border border-ink/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-grass">{v.arc}</span>
                    <span className="font-display font-bold">{v.title}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${l.lineCount <= 22 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      {l.lineCount} lines
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${l.nameCount >= 4 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      name ×{l.nameCount}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${l.nameEarly ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      {l.nameEarly ? 'name in first 2 lines' : 'name NOT early'}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-ink/50">{v.style_prompt}</p>
                  <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-paper p-3 text-xs leading-relaxed">
                    {v.lyrics}
                  </pre>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-2">
          <h2 className="mb-3 font-display text-lg font-bold">4 · Song</h2>
          {variants.length === 0 && <p className="text-sm text-ink/50">Lyrics first.</p>}
          <div className="space-y-4">
            {variants.map((v, i) => {
              const s = sing[i] || { status: 'idle' as const };
              return (
                <div key={i} className="rounded-xl border border-ink/10 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-grass">{v.arc}</p>
                  {s.status === 'done' && s.url ? (
                    <audio className="mt-2 w-full" controls src={s.url} />
                  ) : (
                    <button className="btn-primary mt-2 w-full !px-3 !py-2 text-xs"
                      onClick={() => singVariant(i)} disabled={s.status === 'singing'}>
                      {s.status === 'singing' ? 'Singing… ~90s' : 'Generate song'}
                    </button>
                  )}
                  {s.status === 'error' && <p className="mt-2 text-xs text-red-600">{s.error}</p>}
                  {s.status === 'done' && (
                    <button className="mt-2 w-full text-xs font-semibold text-grass underline"
                      onClick={() => singVariant(i)}>
                      Regenerate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
