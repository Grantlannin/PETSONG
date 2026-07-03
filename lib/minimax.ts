/**
 * MiniMax music-2.6 client.
 * Docs: https://platform.minimax.io/docs/api-reference/music-generation
 * Response contains hex-encoded audio in data.audio.
 */

const ALLOWED_MODELS = [
  'music-2.6',
  'music-2.6-free',
  'music-cover',
  'music-cover-free',
] as const;

interface MiniMaxResponse {
  data?: { audio?: string; status?: number };
  base_resp?: { status_code?: number; status_msg?: string };
}

function resolveModel(): string {
  const raw = (process.env.MINIMAX_MODEL || 'music-2.6-free')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (ALLOWED_MODELS.includes(raw as (typeof ALLOWED_MODELS)[number])) {
    return raw;
  }

  console.warn(`Invalid MINIMAX_MODEL "${raw}", falling back to music-2.6-free`);
  return 'music-2.6-free';
}

function resolveApiHost(): string {
  const host = (process.env.MINIMAX_API_HOST || 'https://api.minimax.io')
    .trim()
    .replace(/\/$/, '');
  return host;
}

export async function generateSong(opts: {
  stylePrompt: string;
  lyrics: string;
}): Promise<Buffer> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) throw new Error('Missing MINIMAX_API_KEY');

  const model = resolveModel();
  const apiHost = resolveApiHost();
  const url = `${apiHost}/v1/music_generation`;

  const doCall = async (): Promise<Buffer> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: opts.stylePrompt.slice(0, 2000),
        lyrics: opts.lyrics.slice(0, 3500),
        output_format: 'hex',
        audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
      }),
    });

    if (!res.ok) {
      throw new Error(`MiniMax HTTP ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as MiniMaxResponse;
    if (json.base_resp && json.base_resp.status_code !== 0) {
      const code = json.base_resp.status_code;
      const msg = json.base_resp.status_msg || 'unknown';
      let hint = '';
      if (code === 2061) {
        hint =
          model.includes('free')
            ? ' Your key looks like a Token Plan key — set MINIMAX_MODEL=music-2.6 (not -free). Or use a pay-as-you-go API key from API Keys for music-2.6-free.'
            : ' Your key may not include music. Use a Token Plan subscription key with music-2.6, or a pay-as-you-go API key with credits.';
      }
      throw new Error(
        `MiniMax error ${code}: ${msg} (model=${model}, host=${apiHost}).${hint}`
      );
    }
    const hex = json.data?.audio;
    if (!hex) throw new Error('MiniMax returned no audio');
    return Buffer.from(hex, 'hex');
  };

  try {
    return await doCall();
  } catch (e) {
    console.warn('MiniMax call failed, retrying once:', e);
    return await doCall();
  }
}
