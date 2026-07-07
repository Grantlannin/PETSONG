import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

/** Trim a full song to a short mp3 clip. */
export async function makeClip(
  fullMp3: Buffer,
  durationSec: number,
  bitrate = '96k'
): Promise<Buffer> {
  const id = randomUUID();
  const inPath = join(tmpdir(), `${id}-in.mp3`);
  const outPath = join(tmpdir(), `${id}-clip.mp3`);
  await writeFile(inPath, fullMp3);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inPath)
      .setStartTime(0)
      .duration(durationSec)
      .audioBitrate(bitrate)
      .format('mp3')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outPath);
  });

  const out = await readFile(outPath);
  await Promise.allSettled([unlink(inPath), unlink(outPath)]);
  return out;
}

/** Trim the full song to a 45s 96kbps preview clip. */
export async function makePreviewClip(fullMp3: Buffer): Promise<Buffer> {
  return makeClip(fullMp3, 45);
}
