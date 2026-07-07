/** Rough seconds per sung lyric line — used to seek landing previews. */
const SEC_PER_LINE = 3.4;

interface LyricSection {
  name: string;
  lines: string[];
}

function parseSections(lyrics: string): LyricSection[] {
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;

  for (const line of lyrics.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const tag = t.match(/^\[(.+)\]$/);
    if (tag) {
      current = { name: tag[1].toLowerCase(), lines: [] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(t);
  }

  return sections;
}

function linesBeforeSection(sections: LyricSection[], index: number): number {
  let count = 0;
  for (let i = 0; i < index; i++) count += sections[i].lines.length;
  return count;
}

/**
 * Landing preview: last 2 lines of [Bridge] + the [Chorus] that follows.
 * Falls back to first [Chorus] if there is no bridge.
 */
export function estimatePreviewStartSec(lyrics: string): number {
  const sections = parseSections(lyrics);
  const bridgeIdx = sections.findIndex((s) => s.name === 'bridge');

  if (bridgeIdx >= 0) {
    const bridge = sections[bridgeIdx];
    const linesBeforeBridge = linesBeforeSection(sections, bridgeIdx);
    const skipIntoBridge = Math.max(0, bridge.lines.length - 2);
    return (linesBeforeBridge + skipIntoBridge) * SEC_PER_LINE;
  }

  const chorusIdx = sections.findIndex((s) => s.name === 'chorus');
  if (chorusIdx >= 0) {
    return linesBeforeSection(sections, chorusIdx) * SEC_PER_LINE;
  }

  return 0;
}

export function previewWindow(lyrics: string, durationSec = 10) {
  const startSec = estimatePreviewStartSec(lyrics);
  return { startSec, endSec: startSec + durationSec, durationSec };
}
