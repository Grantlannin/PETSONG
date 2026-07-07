'use client';

import { useRef, useState } from 'react';
import { landingSamplesWithUrls } from '@/lib/landing-sample-urls';
import type { LandingSample } from '@/lib/landing-samples';
import { Vinyl } from '@/lib/vinyl';

const SAMPLES = landingSamplesWithUrls();

function SampleCard({
  sample,
  active,
  onPlay,
}: {
  sample: LandingSample;
  active: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(sample.id)}
      className={`flex w-[min(280px,78vw)] shrink-0 snap-center flex-col rounded-2xl border-2 p-5 text-left transition ${
        active
          ? 'border-grass bg-white shadow-md'
          : 'border-ink/10 bg-white/80 hover:border-grass/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-grass">{sample.label}</span>
          <h3 className="mt-1 font-display text-lg font-bold leading-tight">{sample.title}</h3>
          <p className="mt-0.5 text-xs text-ink/50">
            {sample.petName} · {sample.arc === 'funny' ? 'funny' : 'heartfelt'}
          </p>
        </div>
        <Vinyl size={52} spinning={active} />
      </div>
      <p className="mt-4 font-mono text-[10px] text-ink/40">
        {active ? 'Playing 10s preview…' : 'Tap to preview · 10 seconds'}
      </p>
    </button>
  );
}

export function LandingSamplePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  function stop() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingId(null);
    setProgress(0);
  }

  function play(id: string) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;

    if (playingId === id) {
      stop();
      return;
    }

    stop();
    setLoadError(null);
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = sample.src;
    audio.currentTime = 0;
    setPlayingId(id);
    void audio.play().catch(() => {
      setPlayingId(null);
      setProgress(0);
      setLoadError('Preview clips not uploaded yet. In /lab, click “Generate landing demos” (one-time, ~5 min).');
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50">Try before you buy</p>
        <h2 className="mt-2 font-display text-2xl font-black md:text-3xl">Hear what yours could sound like</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink/60">
          Real songs generated from a real pet story — scroll through genres and play a 10-second preview.
        </p>
      </div>

      <div className="relative mt-8">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#2F5D3A_#FBF7EF]">
          {SAMPLES.map((sample) => (
            <SampleCard
              key={sample.id}
              sample={sample}
              active={playingId === sample.id}
              onPlay={play}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-md">
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-grass transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-ink/40">
          {loadError || (playingId ? '10-second preview' : 'Scroll → tap a genre · 10 seconds each')}
        </p>
        {loadError && (
          <p className="mt-2 text-center text-xs text-red-600">
            <a href="/lab" className="font-semibold underline">Open lab</a> to generate clips, then refresh this page.
          </p>
        )}
      </div>

      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          const sample = SAMPLES.find((s) => s.id === playingId);
          const max = sample?.durationSec ?? 10;
          setProgress(Math.min(1, audio.currentTime / max));
          if (audio.currentTime >= max) stop();
        }}
        onEnded={stop}
        onPause={() => {
          if (audioRef.current?.currentTime === 0) setProgress(0);
        }}
      />
    </section>
  );
}
