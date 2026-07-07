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

export const LAB_GENRES = [
  { value: 'pop', label: 'POP' },
  { value: 'jazz', label: 'Jazz' },
  { value: '80s_rock', label: "80's rock" },
] as const;

export function labSelectLabel(fieldKey: string, value: string): string {
  if (fieldKey === 'genre') {
    return LAB_GENRES.find((g) => g.value === value)?.label ?? value;
  }
  return value.replace(/_/g, ' ');
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
    type: 'text',
    placeholder: 'Golden Retriever, tabby cat, bearded dragon, rabbit…',
    sample: SAMPLE_BRIEF.pet_type,
    required: true,
  },
  {
    key: 'physical_features',
    label: 'What do they look like? Any unique physical features?',
    type: 'textarea',
    placeholder: 'Golden fluff, one ear that never stands up, crooked tail, one white toe…',
    hint: 'Concrete visuals only you would notice.',
    sample: String(SAMPLE_BRIEF.physical_features || ''),
    required: false,
  },
  {
    key: 'personality',
    label: 'Personality & what makes them "them"',
    type: 'textarea',
    placeholder:
      'Goofy, gentle, dramatic — and the little habits that make your family say "that\'s so them."',
    hint: 'Who they are on their best day, plus the quirks and routines that are unmistakably them.',
    sample: String(SAMPLE_BRIEF.personality || ''),
    required: true,
  },
  {
    key: 'signature_behaviors',
    label: 'Signature things they do / behaviors',
    type: 'textarea',
    placeholder:
      'Morning rituals, zoomies, stealing socks, weird noises, how they greet people, daily routines they never skip…',
    hint: 'Daily rituals + famous behaviors — anything that instantly reminds people of them.',
    sample: String(SAMPLE_BRIEF.signature_behaviors || ''),
    required: false,
  },
  {
    key: 'favorite_things',
    label: 'Favorite things / toys',
    type: 'textarea',
    placeholder: 'Favorite toys, treats, foods, places, people, activities, comfort items.',
    sample: String(SAMPLE_BRIEF.favorite_things || ''),
    required: false,
  },
  {
    key: 'memorable_inside_jokes',
    label: 'Memorable inside jokes',
    type: 'textarea',
    placeholder: 'Family nicknames, catchphrases, funny stories only people who know them would get.',
    hint: 'The more specific, the better.',
    sample: String(SAMPLE_BRIEF.memorable_inside_jokes || ''),
    required: false,
  },
  {
    key: 'things_they_hate',
    label: 'Things they hate / what they do in rebellion',
    type: 'textarea',
    placeholder: 'Vacuum, baths, squirrels — and the dramatic way they protest…',
    hint: 'What they refuse to tolerate and how they act out about it.',
    sample: String(SAMPLE_BRIEF.things_they_hate || ''),
    required: false,
  },
  {
    key: 'quirks_nobody_else_would_know',
    label: 'Quirks nobody else would know',
    type: 'textarea',
    placeholder: 'Tiny details only someone who lives with them would notice.',
    hint: 'Little habits or moments that make them one of a kind.',
    sample: String(SAMPLE_BRIEF.quirks_nobody_else_would_know || ''),
    required: false,
  },
  {
    key: 'genre',
    label: 'Genre',
    type: 'select',
    options: LAB_GENRES.map((g) => g.value),
    hint: 'Both songs use this genre in their style prompt.',
    sample: SAMPLE_BRIEF.genre || 'pop',
    required: true,
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
