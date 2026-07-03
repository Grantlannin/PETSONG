import Link from 'next/link';
import { Vinyl } from '@/lib/vinyl';

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
        <div className="mb-8 flex items-center gap-3">
          <Vinyl size={64} spinning />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
            A record pressed for your dog
          </span>
        </div>

        <h1 className="font-display text-5xl font-black leading-[1.05] md:text-7xl">
          They&apos;ve heard you sing about them.
          <br />
          <span className="text-grass">Now hear a real song</span> about them.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-ink/70">
          Tell us about your pet — their name, their weird little habits, the story only you know.
          In minutes, you&apos;ll hear three original songs written just about them. Pick the one
          that makes you cry. Or laugh. Or both.
        </p>

        <Link href="/create" className="btn-primary mt-10 text-lg">
          Get Your Song — $37
        </Link>
        <p className="mt-3 font-mono text-xs text-ink/50">
          3 songs generated · you pick your favorite · ready in ~2 minutes
        </p>
      </section>

      {/* How it works */}
      <section className="border-y-2 border-ink/10 bg-white/50">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            {
              t: 'Tell us their story',
              d: 'Name, breed, the sock-stealing, the 9pm zoomies — the details that make them them.',
            },
            {
              t: 'We write & record 3 songs',
              d: 'A funny one, a sweet one, and a tearjerker. Each one is genuinely about your pet.',
            },
            {
              t: 'Pick your favorite',
              d: 'Preview all three. Keep the one you love — or unlock all three for a little more.',
            },
          ].map((s, i) => (
            <div key={s.t}>
              <div className="font-display text-4xl font-bold text-tennisdark">{i + 1}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA repeat */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-black md:text-4xl">
          The gift they can&apos;t buy at a pet store.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink/70">
          Birthdays, gotcha days, memorials, or just because they&apos;re a good boy. {/* placeholder copy — Grant to replace */}
        </p>
        <Link href="/create" className="btn-primary mt-8">
          Get Your Song — $37
        </Link>
      </section>

      <footer className="border-t-2 border-ink/10 py-8 text-center font-mono text-xs text-ink/40">
        © {new Date().getFullYear()} — every song is one of one.
      </footer>
    </main>
  );
}
