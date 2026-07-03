'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Vinyl } from '@/lib/vinyl';

const OCCASIONS = ['birthday', 'gotcha day', 'holiday gift', 'memorial', 'just because'];
const VIBES = ['upbeat', 'sweet', 'tearjerker', 'surprise me'];

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    pet_name: '',
    nickname: '',
    pet_type: 'dog',
    breed: '',
    quirks: '',
    physical_detail: '',
    occasion: 'birthday',
    emotional_anchor: '',
    vibe: 'surprise me',
    email: '',
  });
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleGetSong() {
    setError('');
    if (!form.pet_name || !form.quirks || !form.email.includes('@')) {
      setError('Please fill in at least: pet name, their quirks, and your email.');
      return;
    }
    setBusy(true);
    try {
      const { email, ...brief } = form;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, brief }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create order');
      setOrderId(json.orderId);
      setShowPayment(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleMockPay() {
    if (!orderId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/mock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Payment failed');
      // Kick off generation without awaiting — the preview page polls status.
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        keepalive: true,
      }).catch(() => {});
      router.push(`/preview/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Vinyl size={44} />
        <h1 className="font-display text-3xl font-black">Tell us about them</h1>
      </div>
      <p className="mb-8 text-ink/70">
        The more specific you are, the better the song. &ldquo;Steals socks from the hamper&rdquo;
        beats &ldquo;playful&rdquo; every time.
      </p>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pet_name">Pet&apos;s name *</label>
            <input id="pet_name" className="field" placeholder="Biscuit"
              value={form.pet_name} onChange={(e) => set('pet_name', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="nickname">Nickname (if any)</label>
            <input id="nickname" className="field" placeholder="Bis"
              value={form.nickname} onChange={(e) => set('nickname', e.target.value)} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pet_type">What kind of pet? *</label>
            <select id="pet_type" className="field" value={form.pet_type}
              onChange={(e) => set('pet_type', e.target.value)}>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="breed">Breed</label>
            <input id="breed" className="field" placeholder="Golden Retriever"
              value={form.breed} onChange={(e) => set('breed', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="quirks">2–3 funny or weird things they do *</label>
          <textarea id="quirks" className="field min-h-28" placeholder="Steals socks from the hamper. Zoomies around the couch every night at 9pm sharp. Won't walk past the mailbox without a full sniff inspection."
            value={form.quirks} onChange={(e) => set('quirks', e.target.value)} />
          <p className="hint">These become the second verse — the more specific, the funnier.</p>
        </div>

        <div>
          <label className="label" htmlFor="physical_detail">One physical detail</label>
          <input id="physical_detail" className="field" placeholder="One ear never stands up all the way"
            value={form.physical_detail} onChange={(e) => set('physical_detail', e.target.value)} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="occasion">The occasion *</label>
            <select id="occasion" className="field" value={form.occasion}
              onChange={(e) => set('occasion', e.target.value)}>
              {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="vibe">The vibe you want</label>
            <select id="vibe" className="field" value={form.vibe}
              onChange={(e) => set('vibe', e.target.value)}>
              {VIBES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="emotional_anchor">
            What have they gotten you through? (optional — but this is where the magic lives)
          </label>
          <textarea id="emotional_anchor" className="field min-h-24" placeholder="He never left my side during the hardest year of my life."
            value={form.emotional_anchor} onChange={(e) => set('emotional_anchor', e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="email">Your email *</label>
          <input id="email" type="email" className="field" placeholder="you@example.com"
            value={form.email} onChange={(e) => set('email', e.target.value)} />
          <p className="hint">Your songs get delivered here.</p>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button className="btn-primary w-full text-lg" onClick={handleGetSong} disabled={busy}>
          {busy ? 'One sec…' : `Get ${form.pet_name || 'Your'} Song — $37`}
        </button>
      </div>

      {/* TODO(stripe): replace this modal with Stripe Embedded Checkout / CheckoutDrawer */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6">
          <div className="w-full max-w-md rounded-3xl bg-paper p-8 shadow-2xl">
            <div className="mb-4 flex justify-center"><Vinyl size={72} spinning /></div>
            <h2 className="text-center font-display text-2xl font-black">
              {form.pet_name}&apos;s songs
            </h2>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm">1 personalized song (your pick of 3)</span>
              <span className="font-display text-xl font-bold">$37</span>
            </div>
            <button className="btn-primary mt-6 w-full" onClick={handleMockPay} disabled={busy}>
              {busy ? 'Processing…' : 'Complete Purchase (TEST MODE)'}
            </button>
            <p className="mt-3 text-center font-mono text-xs text-ink/40">
              Test mode — no card charged. Stripe goes here later.
            </p>
            <button className="mt-2 w-full text-center text-sm text-ink/50 underline"
              onClick={() => setShowPayment(false)} disabled={busy}>
              Go back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
