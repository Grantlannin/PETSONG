import { SAMPLE_BRIEF } from './sample-brief';

export interface LabField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  sample: string;
  required: boolean;
}

/** Default intake — editable in /lab without inferring first. */
export const DEFAULT_INTAKE_FIELDS: LabField[] = [
  { key: 'pet_name', label: 'Pet name', type: 'text', sample: SAMPLE_BRIEF.pet_name, required: true },
  { key: 'nickname', label: 'Nickname', type: 'text', sample: SAMPLE_BRIEF.nickname || '', required: false },
  { key: 'pet_type', label: 'Pet type', type: 'text', sample: SAMPLE_BRIEF.pet_type, required: true },
  { key: 'breed', label: 'Breed', type: 'text', sample: SAMPLE_BRIEF.breed || '', required: false },
  {
    key: 'quirks',
    label: 'Quirks',
    type: 'textarea',
    sample: SAMPLE_BRIEF.quirks,
    required: true,
  },
  {
    key: 'physical_detail',
    label: 'Physical detail',
    type: 'text',
    sample: SAMPLE_BRIEF.physical_detail || '',
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
    key: 'emotional_anchor',
    label: 'Emotional anchor',
    type: 'textarea',
    sample: SAMPLE_BRIEF.emotional_anchor || '',
    required: false,
  },
  {
    key: 'vibe',
    label: 'Vibe',
    type: 'select',
    options: ['upbeat', 'sweet', 'tearjerker'],
    sample: SAMPLE_BRIEF.vibe || '',
    required: false,
  },
];

export function defaultIntakeValues(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of DEFAULT_INTAKE_FIELDS) {
    values[f.key] = f.sample || '';
  }
  return values;
}

/** ~3 min target: lyric lines excluding [Section] tags. Tune via prompt, not code. */
export const TARGET_LINE_MIN = 34;
export const TARGET_LINE_MAX = 48;

export function lineCountStatus(count: number): 'ok' | 'short' | 'long' {
  if (count >= TARGET_LINE_MIN && count <= TARGET_LINE_MAX) return 'ok';
  if (count < TARGET_LINE_MIN) return 'short';
  return 'long';
}
