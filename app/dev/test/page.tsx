'use client';

import { useState } from 'react';
import { SAMPLE_BRIEF } from '@/lib/sample-brief';

/**
 * Dev-only pipeline tester: fires the whole Claude -> MiniMax -> storage flow
 * with the hardcoded sample brief, no form filling. Route it protects (the
 * API) is blocked outside NODE_ENV=development.
 */
export default function DevTestPage() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  async function run() {
    setBusy(true);
    setPreviewUrl('');
    setLog((l) => [...l, `▶ ${new Date().toLocaleTimeString()} — generating with sample brief…`]);
    try {
      const res = await fetch('/api/dev/generate-sample', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'failed');
      setLog((l) => [...l, `✓ done — order ${json.orderId}`]);
      setPreviewUrl(json.previewUrl);
    } catch (e) {
      setLog((l) => [...l, `✗ ${e instanceof Error ? e.message : 'failed'}`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-black">Pipeline test bench</h1>
      <p className="mt-2 text-ink/70">
        Runs Claude → MiniMax → storage with the sample brief in{' '}
        <code className="font-mono text-sm">lib/sample-brief.ts</code>. Edit{' '}
        <code className="font-mono text-sm">lib/lyrics-prompt.ts</code>, hit the button, listen.
      </p>

      <button className="btn-primary mt-6" onClick={run} disabled={busy}>
        {busy ? 'Generating (~1–2 min)…' : 'Generate with sample brief'}
      </button>

      {previewUrl && (
        <a className="btn-tennis ml-3 mt-6" href={previewUrl}>
          Open preview page →
        </a>
      )}

      <pre className="mt-8 min-h-32 whitespace-pre-wrap rounded-xl bg-ink p-4 font-mono text-xs text-tennis">
        {log.join('\n') || 'No runs yet.'}
      </pre>

      <details className="mt-6">
        <summary className="cursor-pointer font-semibold text-grass">Current sample brief</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-paper p-4 font-mono text-xs">
          {JSON.stringify(SAMPLE_BRIEF, null, 2)}
        </pre>
      </details>
    </main>
  );
}
