import { LANDING_SAMPLES, type LandingSample } from './landing-samples';

const BUCKET = 'songs-previews';

/** Public URL for a landing demo clip (Supabase storage, with local fallback). */
export function landingSampleSrc(genre: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/landing/${genre}.mp3`;
  }
  return `/samples/${genre}.mp3`;
}

export function landingSampleMetaUrl(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/landing/meta.json`;
}

export interface LandingSampleMeta {
  [genre: string]: {
    title: string;
    arc: string;
    previewStartSec: number;
    style_prompt?: string;
  };
}

export function landingSamplesWithUrls(): LandingSample[] {
  return LANDING_SAMPLES.map((s) => ({
    ...s,
    src: landingSampleSrc(s.genre),
  }));
}
