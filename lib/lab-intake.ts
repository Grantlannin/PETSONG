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
    type: 'text',
    placeholder: 'Golden Retriever, tabby cat, bearded dragon, rabbit…',
    sample: SAMPLE_BRIEF.pet_type,
    required: true,
  },
  {
    key: 'breed',
    label: 'Breed or mix (optional)',
    type: 'text',
    placeholder: 'Golden Retriever, mystery mutt',
    sample: SAMPLE_BRIEF.breed || '',
    required: false,
  },
  {
    key: 'personality',
    label: 'Personality',
    type: 'textarea',
    placeholder:
      'Goofy, gentle, dramatic. On their best day they… Share a few stories that show who they really are.',
    hint: 'Describe your pet in a few words — goofy, stubborn, protective, gentle, dramatic, anxious, mischievous, or something else.',
    sample: String(SAMPLE_BRIEF.personality || ''),
    required: true,
  },
  {
    key: 'what_makes_them_them',
    label: 'What Makes Them "Them"',
    type: 'textarea',
    placeholder:
      'The little habits and routines that make your family say, "That\'s so them."',
    hint: 'Funny quirks, routines, or things they always do.',
    sample: String(SAMPLE_BRIEF.what_makes_them_them || ''),
    required: false,
  },
  {
    key: 'signature_daily_rituals',
    label: 'Signature Daily Rituals',
    type: 'textarea',
    placeholder:
      'First thing in the morning, when someone comes home, at mealtime, during walks, before bed…',
    hint: 'Walk us through their daily routine — rituals they never skip.',
    sample: String(SAMPLE_BRIEF.signature_daily_rituals || ''),
    required: false,
  },
  {
    key: 'memorable_inside_jokes',
    label: 'Memorable Inside Jokes',
    type: 'textarea',
    placeholder: 'Family nicknames, catchphrases, funny stories only people who know them would get.',
    hint: 'The more specific, the better.',
    sample: String(SAMPLE_BRIEF.memorable_inside_jokes || ''),
    required: false,
  },
  {
    key: 'signature_behaviors',
    label: 'Signature Behaviors',
    type: 'textarea',
    placeholder:
      'Zoomies, stealing socks, demanding treats, weird noises, odd sleeping positions, special greetings…',
    hint: 'What they\'re famous for — anything that instantly reminds people of them.',
    sample: String(SAMPLE_BRIEF.signature_behaviors || ''),
    required: false,
  },
  {
    key: 'favorite_things',
    label: 'Favorite Things / Toys',
    type: 'textarea',
    placeholder: 'Favorite toys, treats, foods, places, people, activities, comfort items.',
    hint: 'What makes them happiest?',
    sample: String(SAMPLE_BRIEF.favorite_things || ''),
    required: false,
  },
  {
    key: 'things_they_hate',
    label: 'Things They Hate',
    type: 'textarea',
    placeholder: 'Vacuum, baths, squirrels, thunderstorms, nail trims, the mail carrier…',
    hint: 'Anything they have strong opinions about.',
    sample: String(SAMPLE_BRIEF.things_they_hate || ''),
    required: false,
  },
  {
    key: 'quirks_nobody_else_would_know',
    label: 'Quirks Nobody Else Would Know',
    type: 'textarea',
    placeholder: 'Tiny details only someone who lives with them would notice.',
    hint: 'Little habits or moments that make them one of a kind — good fuel for the heartfelt song.',
    sample: String(SAMPLE_BRIEF.quirks_nobody_else_would_know || ''),
    required: false,
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
    options: ['', 'funny', 'heartfelt'],
    hint: 'We still generate both modes — this nudges the set.',
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
