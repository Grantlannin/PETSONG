/** Rough seconds per sung lyric line — used to seek previews to chorus/bridge. */
const SEC_PER_LINE = 3.4;

function lyricLinesBeforeSection(lyrics: string, sectionName: string): number | null {
  const target = sectionName.toLowerCase();
  let count = 0;
  let found = false;

  for (const line of lyrics.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const tag = t.match(/^\[(.+)\]$/);
    if (tag) {
      if (tag[1].toLowerCase() === target) {
        found = true;
        break;
      }
      continue;
    }
    count++;
  }

  return found ? count : null;
}

/**
 * Where to start a landing preview so it hits the bridge + final chorus, not the intro.
 * Prefers [Bridge]; falls back to first [Chorus].
 */
export function estimatePreviewStartSec(lyrics: string): number {
  const bridgeLines = lyricLinesBeforeSection(lyrics, 'bridge');
  if (bridgeLines != null) {
    return Math.max(0, bridgeLines * SEC_PER_LINE);
  }

  const chorusLines = lyricLinesBeforeSection(lyrics, 'chorus');
  if (chorusLines != null) {
    return Math.max(0, chorusLines * SEC_PER_LINE);
  }

  return 0;
}

export function previewWindow(lyrics: string, durationSec = 10) {
  const startSec = estimatePreviewStartSec(lyrics);
  return { startSec, endSec: startSec + durationSec, durationSec };
}
