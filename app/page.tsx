import Link from 'next/link';
import { LandingSamplePlayer } from '@/components/LandingSamplePlayer';
import { Vinyl } from '@/lib/vinyl';

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-16 text-center md:pt-20">
        <div className="mb-6 flex items-center gap-3">
          <Vinyl size={56} spinning />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
            A song pressed for your pet
          </span>
        </div>

        <h1 className="font-display text-5xl font-black leading-[1.05] md:text-7xl">
          They&apos;ve heard you sing about them.
          <br />
          <span className="text-grass">Now hear a real song</span> about them.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-ink/70">
          Tell us their name, their weird habits, the inside jokes only your family gets.
          We write two original songs — one funny, one heartfelt — and you pick your favorite.
        </p>

        <Link href="/create" className="btn-primary mt-8 text-lg">
          Get Your Song — $37
        </Link>
        <p className="mt-3 font-mono text-xs text-ink/50">
          2 songs · ~2 minutes · POP, Jazz, or 80&apos;s rock
        </p>
      </section>

      {/* Sample previews */}
      <section className="border-y-2 border-ink/10 bg-white/60 py-14">
        <LandingSamplePlayer />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center font-display text-3xl font-black">How it works</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            {
              t: 'Tell us their story',
              d: 'Name, nicknames, the chud moments, the zoomies, the things they destroy — the details that make them them.',
            },
            {
              t: 'We write & record 2 songs',
              d: 'A funny one and a heartfelt one, in your chosen genre. Every line comes from what you wrote.',
            },
            {
              t: 'Pick your favorite',
              d: 'Preview both. Keep the one you love — or unlock both for a little more.',
            },
          ].map((s, i) => (
            <div key={s.t} className="rounded-2xl border-2 border-ink/10 bg-white p-6">
              <div className="font-display text-4xl font-bold text-tennisdark">{i + 1}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mx-auto flex justify-center">
          <Vinyl size={80} />
        </div>
        <h2 className="mt-6 font-display text-3xl font-black md:text-4xl">
          The gift they can&apos;t buy anywhere else.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink/70">
          Birthdays, gotcha days, memorials, or just because they&apos;re the gremlin you love.
        </p>
        <Link href="/create" className="btn-primary mt-8">
          Get Your Song — $37
        </Link>
      </section>

      <footer className="border-t-2 border-ink/10 py-8 text-center font-mono text-xs text-ink/40">
        © {new Date().getFullYear()} Pet Song — every song is one of one.
      </footer>
    </main>
  );
}
