import { supabaseAdmin } from './supabase';
import { generateLyricVariants } from './claude';
import { generateSong } from './minimax';
import { makePreviewClip } from './preview';
import type { Brief, SongVariant } from './types';

/**
 * Full pipeline for one order:
 * Claude (1 call, 3 lyric variants) -> MiniMax x3 in parallel -> upload full + preview.
 * Idempotent-ish: flips status paid -> generating first; bails if already past paid.
 */
export async function runGeneration(orderId: string): Promise<void> {
  const db = supabaseAdmin();

  const { data: order, error } = await db.from('orders').select('*').eq('id', orderId).single();
  if (error || !order) throw new Error(`Order not found: ${orderId}`);
  if (order.status !== 'paid') {
    console.log(`Order ${orderId} status is ${order.status}; skipping generation`);
    return;
  }

  await db.from('orders').update({ status: 'generating', error: null }).eq('id', orderId);

  try {
    const brief = order.brief as Brief;
    const variants = await generateLyricVariants(brief);

    const results = await Promise.allSettled(
      variants.map((v, i) => generateOneVariant(orderId, i + 1, v))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    if (succeeded === 0) {
      throw new Error('All three song generations failed');
    }

    await db.from('orders').update({ status: 'preview_ready' }).eq('id', orderId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Generation failed for order ${orderId}:`, msg);
    await db.from('orders').update({ status: 'failed', error: msg }).eq('id', orderId);
    throw e;
  }
}

/** Generate + upload a single variant. Exported for the dashboard's regenerate button. */
export async function generateOneVariant(
  orderId: string,
  variantNum: number,
  v: SongVariant
): Promise<void> {
  const db = supabaseAdmin();

  const fullMp3 = await generateSong({ stylePrompt: v.style_prompt, lyrics: v.lyrics });
  const preview = await makePreviewClip(fullMp3);

  const base = `${orderId}/variant-${variantNum}`;
  const fullPath = `${base}.mp3`;
  const previewPath = `${base}-preview.mp3`;

  const up1 = await db.storage
    .from('songs-full')
    .upload(fullPath, fullMp3, { contentType: 'audio/mpeg', upsert: true });
  if (up1.error) throw new Error(`Upload full failed: ${up1.error.message}`);

  const up2 = await db.storage
    .from('songs-previews')
    .upload(previewPath, preview, { contentType: 'audio/mpeg', upsert: true });
  if (up2.error) throw new Error(`Upload preview failed: ${up2.error.message}`);

  const { error } = await db.from('songs').upsert(
    {
      order_id: orderId,
      variant: variantNum,
      arc: v.arc,
      title: v.title,
      lyrics: v.lyrics,
      style_prompt: v.style_prompt,
      audio_path: fullPath,
      preview_path: previewPath,
    },
    { onConflict: 'order_id,variant' }
  );
  if (error) throw new Error(`Song row upsert failed: ${error.message}`);
}

export function previewPublicUrl(previewPath: string): string {
  const db = supabaseAdmin();
  return db.storage.from('songs-previews').getPublicUrl(previewPath).data.publicUrl;
}

export async function fullSignedUrl(audioPath: string): Promise<string> {
  const db = supabaseAdmin();
  const { data, error } = await db.storage.from('songs-full').createSignedUrl(audioPath, 60 * 60);
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}
