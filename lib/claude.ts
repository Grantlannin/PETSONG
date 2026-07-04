import Anthropic from '@anthropic-ai/sdk';
import { LAB_INTAKE_FIELDS } from './lab-intake';
import { LYRICS_SYSTEM_PROMPT } from './lyrics-prompt';
import type { Brief, SongVariant } from './types';

/**
 * Always-on songwriting constraints — pipeline quality, not the master template
 * in lib/lyrics-prompt.ts (Grant owns that). Applied in lab and production.
 */
export const INTAKE_FIDELITY_RULES = `You write personalized pet songs from a customer intake form. The intake IS the song — not inspiration for a generic pet song.

SOURCE OF TRUTH (non-negotiable)
- Every lyric line must trace to a specific fact the customer wrote: a name, nickname, behavior, ritual, joke, object, person, place, hatred, or memory from their brief.
- If a detail is not in the brief, do not invent it. No filler scenes, no made-up family members, no guessed breeds or hobbies.
- Prefer the customer's exact images and phrases over vague paraphrase. "Steals socks from the hamper" beats "playful pup."

NO MEANINGLESS FILLER (the main thing to kill)
- Every line must say something SPECIFIC — a behavior, object, person, place, ritual, joke, or moment from the brief.
- BANNED: lines that sound pretty but mean nothing. Vague adjective chains, empty mood words, generic sensory fluff, and abstract metaphors that aren't in the brief.
- BANNED: inventing poetic images (logs, rivers, stars, journeys) to fill a rhyme unless the customer actually wrote that image.
- BAD examples (never write lines like these):
  • "Morning walks with you are golden soft and slow" — "golden soft and slow" is filler; say WHAT happens on the walk (grabs the leash, mailbox sniff, creek at the end of the street)
  • "Standing tall on two legs, eyes so bright and wide" — "bright and wide" means nothing; say what they actually DO (ear that flops, sits on your feet, one white toe)
  • "We were just supposed to be a stopping log" — nonsense metaphor; if walks matter, use their actual walk ritual from the brief
  • "Every moment with you feels warm and true" — pure slop; replace with a fact from the brief
  • "Your spirit shines like sunlight" — poetic nothing; use their actual favorite thing or ritual
- TEST each line: if you swapped in a different pet's name and the line still works, it is filler — rewrite with a brief-specific detail.
- If a listener would ask "what does that mean?" or "why a log?" — the line fails. Rewrite in plain, specific language from the brief.
- Rhyme is fine; empty rhyme is not. Never sacrifice specificity to make a line scan.

BANNED unless the customer wrote it or occasion is memorial
- Invented scenes, people, places, or habits not in the brief
- Rainbow bridge / loss language unless occasion is memorial

DRAMA & ARCS (heighten THEIR material, not generic emotion)
- funny: punchlines from signature_behaviors, things_they_hate, memorable_inside_jokes, if_they_could_talk
- sweet: signature_daily_rituals, favorite_things, special_relationships, what_makes_them_them
- tearjerker: emotional_moments, quirks_nobody_else_would_know, if_they_could_talk — cinematic and dramatic, but every image must come from the brief

STRUCTURE
- Pet name in the title and in the first two lyric lines of Verse 1
- Use nickname(s) from the brief where natural
- Each song must reference at least 10 distinct specific facts from the brief (name repeats don't count)
- Each chorus hook must hinge on one concrete image or behavior from the brief — never a generic sentiment

Before finalizing each song, audit every line: "Did the customer tell me this?" If no, rewrite or cut.`;

/**
 * Machine contract — do not move this into lyrics-prompt.ts.
 * The parser below depends on this exact JSON shape, and MiniMax depends on
 * the [Verse]/[Chorus] tag format. The creative template in lib/lyrics-prompt.ts
 * (or a lab override) is prepended as the system prompt and owns everything
 * about HOW the songs are written; this only pins WHAT comes back.
 */
const OUTPUT_CONTRACT = `You will receive a customer brief about one pet. Write THREE complete, distinct personalized songs using ONLY facts from that brief (three different emotional takes).

For each song also write a style_prompt for the music model: under 300 characters, shaped like "<key>, <BPM> BPM, <genre>, <vocal type>, <2-3 mood words>".

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{
  "variants": [
    { "arc": "funny",      "title": "...", "style_prompt": "...", "lyrics": "..." },
    { "arc": "sweet",      "title": "...", "style_prompt": "...", "lyrics": "..." },
    { "arc": "tearjerker", "title": "...", "style_prompt": "...", "lyrics": "..." }
  ]
}
Lyrics formatting: section tags on their own line exactly as [Verse], [Chorus], [Bridge]; one lyric line per line using \\n; blank line (\\n\\n) between sections. Titles include the pet's name.
Each song should contain approximately 36–44 lyric lines (excluding section tags) for roughly 3 minutes of music. MiniMax has no duration knob — length is controlled entirely by lyric line count.`;

const FIELD_LABELS = Object.fromEntries(LAB_INTAKE_FIELDS.map((f) => [f.key, f.label]));

function formatBriefForModel(brief: Brief | Record<string, string>): string {
  const sections: string[] = [];
  for (const [key, raw] of Object.entries(brief)) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    sections.push(`### ${FIELD_LABELS[key] ?? key}\n${value}`);
  }
  return sections.join('\n\n');
}

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
  const system = [creative, INTAKE_FIDELITY_RULES, OUTPUT_CONTRACT].filter(Boolean).join('\n\n---\n\n');
  const briefText = formatBriefForModel(brief);
  if (!briefText.trim()) {
    throw new Error('Brief is empty — fill in the intake first');
  }

  const msg = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system,
    messages: [
      {
        role: 'user',
        content: `Here is everything the customer provided. Use ONLY these details — do not invent anything not listed here.

${briefText}

Write the three songs now. Audit every line against this brief. JSON only.`,
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
