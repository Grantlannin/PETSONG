'use client';

import { useEffect, useRef, useState } from 'react';
import {
  landingSampleMetaUrl,
  landingSamplesWithUrls,
  type LandingSampleMeta,
} from '@/lib/landing-sample-urls';
import type { LandingSample } from '@/lib/landing-samples';
import { Vinyl } from '@/lib/vinyl';

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
        {active ? 'Playing chorus & bridge…' : 'Tap to preview · 10 seconds'}
      </p>
    </button>
  );
}

function clampStartSec(audio: HTMLAudioElement, startSec: number, durationSec: number): number {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return startSec;
  return Math.min(startSec, Math.max(0, audio.duration - durationSec - 0.25));
}

export function LandingSamplePlayer() {
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const tickRef = useRef<number | null>(null);
  const [samples, setSamples] = useState<LandingSample[]>(() => landingSamplesWithUrls());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const startSecRef = useRef(0);
  const endSecRef = useRef(10);

  useEffect(() => {
    const metaUrl = landingSampleMetaUrl();
    if (!metaUrl) return;

    fetch(metaUrl, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((meta: LandingSampleMeta | null) => {
        if (!meta) return;
        setSamples((prev) =>
          prev.map((s) => {
            const m = meta[s.genre];
            if (!m) return s;
            return {
              ...s,
              title: m.title || s.title,
              arc: (m.arc as LandingSample['arc']) || s.arc,
              previewStartSec: m.previewStartSec,
            };
          })
        );
      })
      .catch(() => {});
  }, []);

  // Preload metadata so play() works inside the click handler (browser gesture rules).
  useEffect(() => {
    const map = audioMapRef.current;
    for (const sample of samples) {
      let audio = map.get(sample.id);
      if (!audio) {
        audio = new Audio(sample.src);
        audio.preload = 'metadata';
        map.set(sample.id, audio);
      } else if (audio.src !== sample.src) {
        audio.src = sample.src;
        audio.load();
      }
    }
  }, [samples]);

  useEffect(() => {
    return () => {
      if (tickRef.current != null) cancelAnimationFrame(tickRef.current);
      audioMapRef.current.forEach((a) => {
        a.pause();
        a.src = '';
      });
      audioMapRef.current.clear();
    };
  }, []);

  function stopTick() {
    if (tickRef.current != null) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
  }

  function stopAll() {
    stopTick();
    audioMapRef.current.forEach((a) => {
      a.pause();
    });
    setPlayingId(null);
    setProgress(0);
  }

  function startTick(audio: HTMLAudioElement, id: string) {
    stopTick();
    const tick = () => {
      const start = startSecRef.current;
      const end = endSecRef.current;
      const elapsed = audio.currentTime - start;
      setProgress(Math.min(1, Math.max(0, elapsed / (end - start))));
      if (audio.currentTime >= end - 0.05) {
        stopAll();
        return;
      }
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    setPlayingId(id);
  }

  function seekAndPlay(audio: HTMLAudioElement, sample: LandingSample, id: string) {
    const durationSec = sample.durationSec;
    let startSec = sample.previewStartSec ?? 0;

    const applySeek = () => {
      startSec = clampStartSec(audio, startSec, durationSec);
      startSecRef.current = startSec;
      endSecRef.current = startSec + durationSec;
      audio.currentTime = startSec;
    };

    if (audio.readyState >= 1) applySeek();
    else audio.addEventListener('loadedmetadata', applySeek, { once: true });

    void audio
      .play()
      .then(() => startTick(audio, id))
      .catch(() => {
        stopAll();
        setLoadError('Tap failed to start audio — try again or use a different browser.');
      });
  }

  function play(id: string) {
    const sample = samples.find((s) => s.id === id);
    if (!sample) return;

    if (playingId === id) {
      stopAll();
      return;
    }

    stopAll();
    setLoadError(null);

    const audio = audioMapRef.current.get(id);
    if (!audio) {
      setLoadError('Preview still loading — wait a second and tap again.');
      return;
    }

    // play() must run in the click stack — do not await metadata first.
    seekAndPlay(audio, sample, id);
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50">Try before you buy</p>
        <h2 className="mt-2 font-display text-2xl font-black md:text-3xl">Hear what yours could sound like</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink/60">
          Real songs from a real pet story — previews jump to the chorus and bridge, not the intro.
        </p>
      </div>

      <div className="relative mt-8">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#2F5D3A_#FBF7EF]">
          {samples.map((sample) => (
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
          <p className="mt-2 text-center text-xs text-red-600">{loadError}</p>
        )}
      </div>
    </section>
  );
}
