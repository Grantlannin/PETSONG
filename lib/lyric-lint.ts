/** Rough syllable count for lyric linting — good enough for lab badges. */
export function approxSyllables(line: string): number {
  const words = line
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  let total = 0;
  for (const word of words) {
    const groups = word.match(/[aeiouy]+/g);
    total += Math.max(1, groups?.length ?? 1);
  }
  return total;
}

export interface SyllableLint {
  avg: number;
  maxLine: number;
  longLines: number;
  status: 'ok' | 'uneven' | 'long';
}

export function syllableLint(lyrics: string): SyllableLint {
  const lines = lyrics
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('['));
  if (lines.length === 0) return { avg: 0, maxLine: 0, longLines: 0, status: 'ok' };

  const counts = lines.map(approxSyllables);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const maxLine = Math.max(...counts);
  const longLines = counts.filter((c) => c > 11).length;

  let status: SyllableLint['status'] = 'ok';
  if (longLines > 0 || maxLine > 12) status = 'long';
  else if (maxLine - Math.min(...counts) > 5) status = 'uneven';

  return { avg: Math.round(avg * 10) / 10, maxLine, longLines, status };
}

export function syllableBadgeClass(status: SyllableLint['status']) {
  if (status === 'ok') return 'bg-green-100 text-green-800';
  if (status === 'long') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-800';
}
