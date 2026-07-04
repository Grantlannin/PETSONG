import { SAMPLE_BRIEF } from './sample-brief';

export interface LabField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  hint?: string;
  options?: string[];
  sample: string;
  required: boolean;
}

/**
 * Fixed lab intake — concrete + emotional fields for personalized songs.
 * Edit values in /lab; field set stays stable so briefs compare cleanly.
 */
export const LAB_INTAKE_FIELDS: LabField[] = [
  {
    key: 'pet_name',
    label: "Pet's name",
    type: 'text',
    placeholder: 'Biscuit',
    sample: SAMPLE_BRIEF.pet_name,
    required: true,
  },
  {
    key: 'nickname',
    label: 'Nickname (what you actually call them)',
    type: 'text',
    placeholder: 'Bis, Bubba, The General',
    sample: SAMPLE_BRIEF.nickname || '',
    required: false,
  },
  {
    key: 'pet_type',
    label: 'What kind of pet?',
    type: 'select',
    options: ['dog', 'cat', 'other'],
    sample: SAMPLE_BRIEF.pet_type,
    required: true,
  },
  {
    key: 'breed',
    label: 'Breed or mix',
    type: 'text',
    placeholder: 'Golden Retriever, tabby, mystery mutt',
    sample: SAMPLE_BRIEF.breed || '',
    required: false,
  },
  {
    key: 'quirks',
    label: '2–3 funny or weird things they do',
    type: 'textarea',
    placeholder:
      'Steals socks from the hamper. Zoomies at 9pm. Won\'t walk past the mailbox without sniffing it.',
    hint: 'Specific beats generic — these land in the funny verse.',
    sample: SAMPLE_BRIEF.quirks,
    required: true,
  },
  {
    key: 'physical_detail',
    label: 'One visual detail only you notice',
    type: 'text',
    placeholder: 'The ear that flops, the crooked tail, the one white toe',
    hint: 'Concrete image the listener can picture.',
    sample: SAMPLE_BRIEF.physical_detail || '',
    required: true,
  },
  {
    key: 'bond',
    label: 'Your relationship in one sentence',
    type: 'textarea',
    placeholder: 'My daughter\'s first dog — the one who slept outside her crib every night',
    hint: 'Who are they to you? How long? What role do they play?',
    sample: String(SAMPLE_BRIEF.bond || ''),
    required: true,
  },
  {
    key: 'signature_moment',
    label: 'One moment you still picture',
    type: 'textarea',
    placeholder: 'The day she brought me her leash when she heard me crying on the phone',
    hint: 'A single scene — the bridge of the song lives here.',
    sample: String(SAMPLE_BRIEF.signature_moment || ''),
    required: true,
  },
  {
    key: 'emotional_anchor',
    label: 'What have they gotten you through?',
    type: 'textarea',
    placeholder: 'The year my mom died. The breakup. Moving alone to a new city.',
    hint: 'This is where the tearjerker arc gets its weight.',
    sample: SAMPLE_BRIEF.emotional_anchor || '',
    required: true,
  },
  {
    key: 'occasion',
    label: 'Occasion',
    type: 'select',
    options: ['birthday', 'gotcha_day', 'memorial', 'just_because'],
    sample: SAMPLE_BRIEF.occasion,
    required: true,
  },
  {
    key: 'vibe',
    label: 'Vibe preference (optional)',
    type: 'select',
    options: ['', 'upbeat', 'sweet', 'tearjerker'],
    hint: 'We still generate all 3 arcs — this nudges the set.',
    sample: SAMPLE_BRIEF.vibe || '',
    required: false,
  },
];

/** @deprecated use LAB_INTAKE_FIELDS */
export const DEFAULT_INTAKE_FIELDS = LAB_INTAKE_FIELDS;

export function defaultIntakeValues(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of LAB_INTAKE_FIELDS) {
    values[f.key] = f.sample || '';
  }
  return values;
}

export function validateIntake(values: Record<string, string>): string | null {
  for (const f of LAB_INTAKE_FIELDS) {
    if (f.required && !values[f.key]?.trim()) {
      return `Fill in: ${f.label}`;
    }
  }
  return null;
}

/** ~3 min target: lyric lines excluding [Section] tags. Tune via prompt, not code. */
export const TARGET_LINE_MIN = 34;
export const TARGET_LINE_MAX = 48;

export function lineCountStatus(count: number): 'ok' | 'short' | 'long' {
  if (count >= TARGET_LINE_MIN && count <= TARGET_LINE_MAX) return 'ok';
  if (count < TARGET_LINE_MIN) return 'short';
  return 'long';
}
