import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { generateLyricVariants } from './claude';
import { LANDING_SAMPLES } from './landing-samples';
import { previewWindow } from './lyric-timing';
import { generateSong } from './minimax';
import { makeClip } from './preview';
import { SAMPLE_BRIEF } from './sample-brief';
import { supabaseAdmin } from './supabase';

const GENRES = ['pop', 'jazz', '80s_rock'] as const;

export interface GeneratedLandingSample {
  genre: string;
  title: string;
  arc: string;
  style_prompt: string;
  previewStartSec: number;
  storagePath: string;
  publicUrl: string;
}

/** Generate 10s clips and upload to Supabase songs-previews/landing/ */
export async function generateLandingSamples(): Promise<GeneratedLandingSample[]> {
  const db = supabaseAdmin();
  const results: GeneratedLandingSample[] = [];
  const meta: Record<
    string,
    { title: string; arc: string; previewStartSec: number; style_prompt: string }
  > = {};

  for (const genre of GENRES) {
    const landing = LANDING_SAMPLES.find((s) => s.genre === genre);
    const arc = landing?.arc ?? 'funny';

    const brief = { ...SAMPLE_BRIEF, genre };
    const variants = await generateLyricVariants(brief);
    const variant = variants.find((v) => v.arc === arc) ?? variants[0];
    const { startSec: previewStartSec } = previewWindow(variant.lyrics, 10);

    const full = await generateSong({ stylePrompt: variant.style_prompt, lyrics: variant.lyrics });
    // Vercel serverless has no ffmpeg — upload full song; homepage player seeks to bridge/chorus.
    const storagePath = `landing/${genre}.mp3`;

    const up = await db.storage
      .from('songs-previews')
      .upload(storagePath, full, { contentType: 'audio/mpeg', upsert: true });
    if (up.error) throw new Error(`Upload ${genre} failed: ${up.error.message}`);

    const publicUrl = db.storage.from('songs-previews').getPublicUrl(storagePath).data.publicUrl;
    meta[genre] = {
      title: variant.title,
      arc: variant.arc,
      previewStartSec,
      style_prompt: variant.style_prompt,
    };
    results.push({
      genre,
      title: variant.title,
      arc: variant.arc,
      style_prompt: variant.style_prompt,
      previewStartSec,
      storagePath,
      publicUrl,
    });
  }

  const metaJson = JSON.stringify(meta, null, 2);
  const metaUp = await db.storage
    .from('songs-previews')
    .upload('landing/meta.json', metaJson, { contentType: 'application/json', upsert: true });
  if (metaUp.error) throw new Error(`Upload meta.json failed: ${metaUp.error.message}`);

  return results;
}

/** Also write to public/samples/ when running locally (optional). */
export async function generateLandingSamplesToDisk(): Promise<GeneratedLandingSample[]> {
  const results: GeneratedLandingSample[] = [];

  for (const genre of GENRES) {
    const landing = LANDING_SAMPLES.find((s) => s.genre === genre);
    const arc = landing?.arc ?? 'funny';

    const brief = { ...SAMPLE_BRIEF, genre };
    const variants = await generateLyricVariants(brief);
    const variant = variants.find((v) => v.arc === arc) ?? variants[0];
    const { startSec: previewStartSec } = previewWindow(variant.lyrics, 10);

    const full = await generateSong({ stylePrompt: variant.style_prompt, lyrics: variant.lyrics });
    const clip = await makeClip(full, 10, '96k', previewStartSec);
    const dir = join(process.cwd(), 'public', 'samples');
    await mkdir(dir, { recursive: true });
    const outPath = join(dir, `${genre}.mp3`);
    await writeFile(outPath, clip);

    results.push({
      genre,
      title: variant.title,
      arc: variant.arc,
      style_prompt: variant.style_prompt,
      previewStartSec,
      storagePath: outPath,
      publicUrl: `/samples/${genre}.mp3`,
    });
  }

  return results;
}
