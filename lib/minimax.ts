/**
 * MiniMax music-2.6 client.
 * Docs: https://platform.minimax.io/docs/api-reference/music-generation
 * Response contains hex-encoded audio in data.audio.
 */
interface MiniMaxResponse {
  data?: { audio?: string; status?: number };
  base_resp?: { status_code?: number; status_msg?: string };
}

export async function generateSong(opts: {
  stylePrompt: string;
  lyrics: string;
}): Promise<Buffer> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('Missing MINIMAX_API_KEY');
  const model = process.env.MINIMAX_MODEL || 'music-2.6-free';

  const doCall = async (): Promise<Buffer> => {
    const res = await fetch('https://api.minimax.io/v1/music_generation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: opts.stylePrompt.slice(0, 2000),
        lyrics: opts.lyrics.slice(0, 3500),
        audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
      }),
    });

    if (!res.ok) {
      throw new Error(`MiniMax HTTP ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as MiniMaxResponse;
    if (json.base_resp && json.base_resp.status_code !== 0) {
      throw new Error(`MiniMax error ${json.base_resp.status_code}: ${json.base_resp.status_msg}`);
    }
    const hex = json.data?.audio;
    if (!hex) throw new Error('MiniMax returned no audio');
    return Buffer.from(hex, 'hex');
  };

  // one retry
  try {
    return await doCall();
  } catch (e) {
    console.warn('MiniMax call failed, retrying once:', e);
    return await doCall();
  }
}
