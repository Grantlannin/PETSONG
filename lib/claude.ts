import Anthropic from '@anthropic-ai/sdk';
import { LYRICS_SYSTEM_PROMPT } from './lyrics-prompt';
import type { Brief, SongVariant } from './types';

/**
 * Machine contract — do not move this into lyrics-prompt.ts.
 * The parser below depends on this exact JSON shape, and MiniMax depends on
 * the [Verse]/[Chorus] tag format. The creative template in lib/lyrics-prompt.ts
 * (or a lab override) is prepended as the system prompt and owns everything
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

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

function parseJson<T>(text: string): T {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as T;
}

/**
 * Generate the three lyric variants.
 * promptOverride: used by the /lab prompt bench to test edits live without
 * touching lib/lyrics-prompt.ts. Production passes nothing.
 */
export async function generateLyricVariants(
  brief: Brief | Record<string, string>,
  promptOverride?: string
): Promise<SongVariant[]> {
  const creative = (promptOverride ?? LYRICS_SYSTEM_PROMPT).trim();
  const system = [creative, OUTPUT_CONTRACT].filter(Boolean).join('\n\n---\n\n');

  const msg = await client().messages.create({
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

  const parsed = parseJson<{ variants: SongVariant[] }>(extractText(msg));
  if (!parsed.variants || parsed.variants.length !== 3) {
    throw new Error('Claude did not return 3 variants');
  }
  return parsed.variants;
}

export interface InferredField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  sample: string;
  required: boolean;
}

/**
 * Lab: read a songwriting prompt and infer what intake fields a customer
 * would need to fill for that prompt to do its job.
 */
export async function inferIntakeForm(songPrompt: string): Promise<InferredField[]> {
  const msg = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You design customer intake forms. You will receive a songwriting system prompt used to generate personalized pet songs. Infer the minimal set of input fields a customer must fill in so that prompt can do its job well. Prefer concrete, specific fields over generic ones. 4-9 fields.

Respond with ONLY valid JSON, no markdown fences:
{
  "fields": [
    {
      "key": "snake_case_key",
      "label": "Human label",
      "type": "text" | "textarea" | "select",
      "placeholder": "example placeholder",
      "options": ["only", "for", "select"],
      "sample": "a realistic filled-in sample value for quick testing",
      "required": true
    }
  ]
}`,
    messages: [
      {
        role: 'user',
        content: `Here is the songwriting prompt:\n\n${songPrompt || '(The prompt is currently empty — infer a sensible default pet-song intake form.)'}\n\nInfer the intake form. JSON only.`,
      },
    ],
  });

  const parsed = parseJson<{ fields: InferredField[] }>(extractText(msg));
  if (!parsed.fields?.length) throw new Error('No fields inferred');
  return parsed.fields;
}
