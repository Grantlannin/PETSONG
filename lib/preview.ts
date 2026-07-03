import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

/** Trim the full song to a 45s 96kbps preview clip. */
export async function makePreviewClip(fullMp3: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inPath = join(tmpdir(), `${id}-in.mp3`);
  const outPath = join(tmpdir(), `${id}-preview.mp3`);
  await writeFile(inPath, fullMp3);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inPath)
      .setStartTime(0)
      .duration(45)
      .audioBitrate('96k')
      .format('mp3')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outPath);
  });

  const out = await readFile(outPath);
  await Promise.allSettled([unlink(inPath), unlink(outPath)]);
  return out;
}
