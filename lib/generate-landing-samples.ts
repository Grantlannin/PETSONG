import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { generateLyricVariants } from './claude';
import { LANDING_SAMPLES } from './landing-samples';
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
  storagePath: string;
  publicUrl: string;
}

/** Generate 10s clips and upload to Supabase songs-previews/landing/ */
export async function generateLandingSamples(): Promise<GeneratedLandingSample[]> {
  const db = supabaseAdmin();
  const results: GeneratedLandingSample[] = [];

  for (const genre of GENRES) {
    const landing = LANDING_SAMPLES.find((s) => s.genre === genre);
    const arc = landing?.arc ?? 'funny';

    const brief = { ...SAMPLE_BRIEF, genre };
    const variants = await generateLyricVariants(brief);
    const variant = variants.find((v) => v.arc === arc) ?? variants[0];

    const full = await generateSong({ stylePrompt: variant.style_prompt, lyrics: variant.lyrics });
    const clip = await makeClip(full, 10);
    const storagePath = `landing/${genre}.mp3`;

    const up = await db.storage
      .from('songs-previews')
      .upload(storagePath, clip, { contentType: 'audio/mpeg', upsert: true });
    if (up.error) throw new Error(`Upload ${genre} failed: ${up.error.message}`);

    const publicUrl = db.storage.from('songs-previews').getPublicUrl(storagePath).data.publicUrl;
    results.push({
      genre,
      title: variant.title,
      arc: variant.arc,
      style_prompt: variant.style_prompt,
      storagePath,
      publicUrl,
    });
  }

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

    const full = await generateSong({ stylePrompt: variant.style_prompt, lyrics: variant.lyrics });
    const clip = await makeClip(full, 10);
    const dir = join(process.cwd(), 'public', 'samples');
    await mkdir(dir, { recursive: true });
    const outPath = join(dir, `${genre}.mp3`);
    await writeFile(outPath, clip);

    results.push({
      genre,
      title: variant.title,
      arc: variant.arc,
      style_prompt: variant.style_prompt,
      storagePath: outPath,
      publicUrl: `/samples/${genre}.mp3`,
    });
  }

  return results;
}
