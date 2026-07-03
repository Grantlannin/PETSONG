'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_INTAKE_FIELDS,
  defaultIntakeValues,
  lineCountStatus,
  TARGET_LINE_MAX,
  TARGET_LINE_MIN,
  type LabField,
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
  const [prompt, setPrompt] = useState(LYRICS_SYSTEM_PROMPT.trim());
  const [fields, setFields] = useState<LabField[]>(DEFAULT_INTAKE_FIELDS);
  const [values, setValues] = useState<Record<string, string>>(defaultIntakeValues);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
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

  function briefPayload(): Record<string, string> {
    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonText) as Record<string, string>;
        return parsed;
      } catch {
        throw new Error('Intake JSON is invalid — fix syntax before writing lyrics');
      }
    }
    return values;
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
      const next: Record<string, string> = {};
      for (const f of json.fields as LabField[]) next[f.key] = f.sample || '';
      setValues(next);
      setJsonMode(false);
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

  function resetIntake() {
    setFields(DEFAULT_INTAKE_FIELDS);
    setValues(defaultIntakeValues());
    setJsonMode(false);
    setJsonText('');
  }

  function addField() {
    const key = `field_${fields.length + 1}`;
    setFields((f) => [
      ...f,
      { key, label: 'New field', type: 'text', sample: '', required: false },
    ]);
    setValues((v) => ({ ...v, [key]: '' }));
  }

  function removeField(key: string) {
    setFields((f) => f.filter((x) => x.key !== key));
    setValues((v) => {
      const next = { ...v };
      delete next[key];
      return next;
    });
  }

  function updateFieldKey(oldKey: string, newKey: string) {
    const trimmed = newKey.trim().replace(/\s+/g, '_').toLowerCase();
    if (!trimmed || trimmed === oldKey) return;
    if (fields.some((f) => f.key === trimmed)) return;
    setFields((f) => f.map((x) => (x.key === oldKey ? { ...x, key: trimmed } : x)));
    setValues((v) => {
      const next = { ...v };
      next[trimmed] = v[oldKey] ?? '';
      delete next[oldKey];
      return next;
    });
  }

  function openJsonMode() {
    setJsonText(JSON.stringify(values, null, 2));
    setJsonMode(true);
  }

  function applyJsonMode() {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, string>;
      setValues(parsed);
      setFields(
        Object.keys(parsed).map((key) => ({
          key,
          label: key.replace(/_/g, ' '),
          type: 'textarea' as const,
          sample: parsed[key] || '',
          required: false,
        }))
      );
      setJsonMode(false);
      setError('');
    } catch {
      setError('Could not apply JSON — check syntax');
    }
  }

  async function writeLyrics() {
    setBusyLyrics(true);
    setError('');
    setVariants([]);
    setSing({});
    try {
      const brief = briefPayload();
      const res = await fetch('/api/lab/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, brief }),
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
          edit intake + prompt → lyrics (~{TARGET_LINE_MIN}–{TARGET_LINE_MAX} lines ≈ 3 min) → song
        </p>
      </div>

      {error && <p className="mx-2 mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">1 · Intake</h2>
            <button className="btn-tennis !px-3 !py-1.5 text-xs" onClick={buildForm} disabled={busyForm}>
              {busyForm ? 'Inferring…' : 'Infer from prompt'}
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" className="text-xs font-semibold text-grass underline" onClick={fillSamples}>
              Fill samples
            </button>
            <button type="button" className="text-xs font-semibold text-grass underline" onClick={resetIntake}>
              Reset default
            </button>
            <button type="button" className="text-xs font-semibold text-grass underline" onClick={openJsonMode}>
              Edit as JSON
            </button>
            <button type="button" className="text-xs font-semibold text-grass underline" onClick={addField}>
              + Add field
            </button>
          </div>

          {jsonMode ? (
            <div className="space-y-2">
              <textarea
                className="field min-h-64 font-mono !text-xs"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" className="btn-primary !px-3 !py-1.5 text-xs flex-1" onClick={applyJsonMode}>
                  Apply JSON
                </button>
                <button type="button" className="btn-tennis !px-3 !py-1.5 text-xs" onClick={() => setJsonMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.key} className="rounded-lg border border-ink/10 p-2">
                  <div className="mb-1.5 flex items-center gap-1">
                    <input
                      className="flex-1 rounded border border-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink/60"
                      value={f.key}
                      onChange={(e) => updateFieldKey(f.key, e.target.value)}
                      title="Field key (snake_case)"
                    />
                    <button
                      type="button"
                      className="text-[10px] text-red-500 hover:underline"
                      onClick={() => removeField(f.key)}
                    >
                      remove
                    </button>
                  </div>
                  <input
                    className="mb-1.5 w-full border-b border-ink/10 pb-0.5 text-xs font-semibold"
                    value={f.label}
                    onChange={(e) =>
                      setFields((all) =>
                        all.map((x) => (x.key === f.key ? { ...x, label: e.target.value } : x))
                      )
                    }
                  />
                  {f.type === 'textarea' ? (
                    <textarea
                      id={`lab-${f.key}`}
                      className="field !px-3 !py-2 text-sm min-h-20"
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
                      <option value="">—</option>
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
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
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">2 · Prompt</h2>
            <button className="btn-primary !px-4 !py-1.5 text-xs" onClick={writeLyrics} disabled={busyLyrics}>
              {busyLyrics ? 'Writing…' : 'Write lyrics →'}
            </button>
          </div>
          <textarea
            className="field min-h-[60vh] font-mono !text-xs leading-relaxed"
            placeholder="Your songwriting system prompt. Structure, line budgets (~36–44 lines for ~3 min), syllable rules, name placement, banned words, arc definitions…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <p className="hint">
            Edits here run live — production still reads lib/lyrics-prompt.ts. Length target (~3 min) is
            enforced via line count in your prompt + the JSON contract.
          </p>
        </section>

        <section className="rounded-2xl border-2 border-ink/10 bg-white p-4 xl:col-span-4">
          <h2 className="mb-3 font-display text-lg font-bold">3 · Lyrics</h2>
          {busyLyrics && <p className="text-sm text-ink/50">Claude is writing… ~10–20s</p>}
          {!busyLyrics && variants.length === 0 && (
            <p className="text-sm text-ink/50">Edit intake and prompt, then hit Write lyrics.</p>
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
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${lineBadgeClass(l.lineStatus)}`}>
                      {l.lineCount} lines ({l.lineStatus === 'ok' ? '~3 min' : l.lineStatus === 'short' ? 'too short' : 'too long'})
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
