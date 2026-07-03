import Anthropic from '@anthropic-ai/sdk';
import { LYRICS_SYSTEM_PROMPT } from './lyrics-prompt';
import type { Brief, SongVariant } from './types';

/**
 * Machine contract — do not move this into lyrics-prompt.ts.
 * The parser below depends on this exact JSON shape, and MiniMax depends on
 * the [Verse]/[Chorus] tag format. Grant's creative template in
 * lib/lyrics-prompt.ts is prepended as the system prompt and owns everything
 * about HOW the songs are written; this only pins WHAT comes back.
 */
const OUTPUT_CONTRACT = `You will receive a JSON brief about one pet. Write THREE complete, distinct personalized songs from it (three different emotional takes).

For each song also write a style_prompt for the music model: under 300 characters, shaped like "<key>, <BPM> BPM, <genre>, <vocal type>, <2-3 mood words>".

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{
  "variants": [
    { "arc": "funny",      "title": "...", "style_prompt": "...", "lyrics": "..." },
    { "arc": "sweet",      "title": "...", "style_prompt": "...", "lyrics": "..." },
    { "arc": "tearjerker", "title": "...", "style_prompt": "...", "lyrics": "..." }
  ]
}
Lyrics formatting: section tags on their own line exactly as [Verse], [Chorus], [Bridge]; one lyric line per line using \\n; blank line (\\n\\n) between sections. Titles include the pet's name.`;

export async function generateLyricVariants(brief: Brief): Promise<SongVariant[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system = [LYRICS_SYSTEM_PROMPT.trim(), OUTPUT_CONTRACT]
    .filter(Boolean)
    .join('\n\n---\n\n');

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system,
    messages: [
      {
        role: 'user',
        content: `Here is the brief:\n${JSON.stringify(brief, null, 2)}\n\nWrite the three songs now. JSON only.`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as { variants: SongVariant[] };

  if (!parsed.variants || parsed.variants.length !== 3) {
    throw new Error('Claude did not return 3 variants');
  }
  return parsed.variants;
}
