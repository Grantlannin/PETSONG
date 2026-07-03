'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Vinyl } from '@/lib/vinyl';

interface DeliveredSong {
  variant: number;
  arc: string | null;
  title: string | null;
  lyrics: string | null;
  download_url: string | null;
}

export default function SongDeliveryPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{ pet_name?: string; bundle: boolean; songs: DeliveredSong[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openLyrics, setOpenLyrics] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/song/${token}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return setNotFound(true);
        setData(await r.json());
      })
      .catch(() => setNotFound(true));
  }, [token]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-black">This link isn&apos;t ready yet.</h1>
        <p className="mt-4 text-ink/70">
          If you just bought a song, finish choosing your favorite on the preview page first.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Vinyl size={100} spinning />
      </main>
    );
  }

  const magicLink = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-2 flex items-center gap-3">
        <Vinyl size={44} spinning />
        <h1 className="font-display text-3xl font-black">
          {data.pet_name ? `${data.pet_name}'s song${data.bundle ? 's' : ''}` : 'Your songs'}
        </h1>
      </div>
      <p className="mb-8 text-ink/70">
        Download below. Save this page&apos;s link — it&apos;s your permanent access.
        {/* TODO(resend): this link also gets emailed once email is wired up */}
      </p>

      <button
        className="btn-tennis mb-8"
        onClick={async () => {
          await navigator.clipboard.writeText(magicLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Link copied' : 'Copy your access link'}
      </button>

      <div className="space-y-6">
        {data.songs.map((s) => (
          <div key={s.variant} className="rounded-3xl border-2 border-ink/10 bg-white p-6">
            <h2 className="font-display text-2xl font-bold">{s.title || `Song ${s.variant}`}</h2>
            {s.download_url && (
              <>
                <audio className="mt-4 w-full" controls preload="none" src={s.download_url} />
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <a className="btn-primary" href={s.download_url} download>
                    Download MP3
                  </a>
                  <button
                    className="text-sm font-semibold text-grass underline"
                    onClick={() => setOpenLyrics(openLyrics === s.variant ? null : s.variant)}
                  >
                    {openLyrics === s.variant ? 'Hide lyrics' : 'Read lyrics'}
                  </button>
                </div>
              </>
            )}
            {openLyrics === s.variant && s.lyrics && (
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-paper p-4 font-body text-sm text-ink/80">
                {s.lyrics}
              </pre>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
