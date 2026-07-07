'use client';

import { useEffect, useState } from 'react';
import { INTAKE_FIDELITY_RULES } from '@/lib/claude';
import {
  defaultIntakeValues,
  LAB_INTAKE_FIELDS,
  labSelectLabel,
  lineCountStatus,
  TARGET_LINE_MAX,
  TARGET_LINE_MIN,
  validateIntake,
} from '@/lib/lab-intake';
import { LYRICS_SYSTEM_PROMPT } from '@/lib/lyrics-prompt';
import type { SongVariant } from '@/lib/types';

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
    lineStatus: lineCountStatus(lines.length),
    nameCount,
    nameEarly: name ? first2.includes(name) : false,
  };
}

function lineBadgeClass(status: 'ok' | 'short' | 'long') {
  if (status === 'ok') return 'bg-green-100 text-green-800';
  if (status === 'short') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
}

export default function LabPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [values, setValues] = useState<Record<string, string>>(defaultIntakeValues);
  const [prompt, setPrompt] = useState(LYRICS_SYSTEM_PROMPT.trim());
  const [showPrompt, setShowPrompt] = useState(false);
  const [variants, setVariants] = useState<SongVariant[]>([]);
  const [sing, setSing] = useState<Record<number, SingState>>({});
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

  function fillSample() {
    setValues(defaultIntakeValues());
    setError('');
  }

  async function generateLyrics() {
    const validationError = validateIntake(values);
    if (validationError) {
      setError(validationError);
      return;
    }

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

  const petName = values.pet_name || '';

  if (authed === null) return <main className="p-12 font-mono text-sm">Loading…</main>;

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <h1 className="font-display text-2xl font-black">Song lab</h1>
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

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
        <h1 className="font-display text-2xl font-black">Song lab</h1>
        <p className="font-mono text-xs text-ink/50">
          intake → lyrics → hear it on MiniMax · target {TARGET_LINE_MIN}–{TARGET_LINE_MAX} lines ≈ 3 min
        </p>
      </div>

      {error && (
        <p className="mx-2 mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Intake */}
        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold">The brief</h2>
              <p className="mt-0.5 text-xs text-ink/50">
                Concrete quirks + emotional truth = songs that hit.
              </p>
            </div>
            <button type="button" className="text-xs font-semibold text-grass underline" onClick={fillSample}>
              Fill Biscuit sample
            </button>
          </div>

          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {LAB_INTAKE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label !mb-1 !text-sm" htmlFor={`lab-${f.key}`}>
                  {f.label}
                  {f.required && ' *'}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`lab-${f.key}`}
                    className="field !px-3 !py-2 text-sm min-h-24"
                    placeholder={f.placeholder}
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : f.type === 'select' ? (
                  <select
                    id={`lab-${f.key}`}
                    className="field !px-3 !py-2 text-sm"
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>{labSelectLabel(f.key, o)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`lab-${f.key}`}
                    className="field !px-3 !py-2 text-sm"
                    placeholder={f.placeholder}
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
                {f.hint && <p className="hint">{f.hint}</p>}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-2 text-xs font-semibold text-ink/40 underline"
            onClick={() => setShowPrompt((s) => !s)}
          >
            {showPrompt ? 'Hide' : 'Show'} lyric prompt (advanced)
          </button>
          {showPrompt && (
            <>
              <label className="label !mb-1 !mt-3 !text-xs text-ink/50">
                Intake fidelity rules (always applied)
              </label>
              <pre className="max-h-48 overflow-y-auto rounded-xl border border-ink/10 bg-paper p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-ink/70">
                {INTAKE_FIDELITY_RULES.trim()}
              </pre>
              <label className="label !mb-1 !mt-3 !text-xs text-ink/50">
                Extra songwriting rules (optional)
              </label>
              <textarea
                className="field min-h-24 font-mono !text-xs leading-relaxed"
                placeholder="Optional — leave blank to use fidelity rules + output contract only."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </>
          )}

          <button
            className="btn-primary mt-4 w-full"
            onClick={generateLyrics}
            disabled={busyLyrics}
          >
            {busyLyrics ? 'Writing lyrics…' : `Write ${petName || 'their'} songs →`}
          </button>
        </section>

        {/* Lyrics + MiniMax */}
        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-7">
          <h2 className="font-display text-lg font-bold">Lyrics &amp; songs</h2>
          {busyLyrics && (
            <p className="mt-2 text-sm text-ink/50">Claude is writing funny + heartfelt… ~10–20s</p>
          )}
          {!busyLyrics && variants.length === 0 && (
            <p className="mt-2 text-sm text-ink/50">
              Fill the brief, then hit Write songs. Generate each version on MiniMax to hear it.
            </p>
          )}

          <div className="mt-4 space-y-5">
            {variants.map((v, i) => {
              const l = lint(v, petName);
              const s = sing[i] || { status: 'idle' as const };
              return (
                <div key={i} className="rounded-xl border border-ink/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-grass">
                        {v.arc}
                      </span>
                      <h3 className="font-display text-lg font-bold">{v.title}</h3>
                    </div>
                    {s.status === 'done' && s.url ? (
                      <audio className="w-full max-w-xs shrink-0" controls src={s.url} />
                    ) : (
                      <button
                        type="button"
                        className="btn-primary !px-4 !py-2 text-xs shrink-0"
                        onClick={() => singVariant(i)}
                        disabled={s.status === 'singing'}
                      >
                        {s.status === 'singing' ? 'MiniMax… ~90s' : 'Generate on MiniMax'}
                      </button>
                    )}
                  </div>

                  {s.status === 'error' && (
                    <p className="mt-2 text-xs text-red-600">{s.error}</p>
                  )}
                  {s.status === 'done' && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-grass underline"
                      onClick={() => singVariant(i)}
                    >
                      Regenerate audio
                    </button>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${lineBadgeClass(l.lineStatus)}`}>
                      {l.lineCount} lines
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${l.nameCount >= 4 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      name ×{l.nameCount}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${l.nameEarly ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      {l.nameEarly ? 'name early' : 'name NOT early'}
                    </span>
                  </div>

                  <p className="mt-2 font-mono text-[10px] text-ink/50">{v.style_prompt}</p>
                  <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-paper p-3 text-xs leading-relaxed">
                    {v.lyrics}
                  </pre>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
