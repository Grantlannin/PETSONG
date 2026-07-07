export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'generating'
  | 'preview_ready'
  | 'delivered'
  | 'failed';

export interface Brief extends Record<string, unknown> {
  pet_name: string;
  nickname?: string;
  pet_type: string;
  physical_features?: string;
  /** @deprecated legacy field */
  breed?: string;
  /** @deprecated legacy customer funnel field */
  quirks?: string;
  /** @deprecated legacy lab field */
  physical_detail?: string;
  /** @deprecated legacy lab field */
  bond?: string;
  /** @deprecated legacy lab field */
  signature_moment?: string;
  /** @deprecated legacy lab field */
  emotional_anchor?: string;
  personality?: string;
  /** @deprecated merged into personality */
  what_makes_them_them?: string;
  /** @deprecated merged into signature_behaviors */
  signature_daily_rituals?: string;
  memorable_inside_jokes?: string;
  signature_behaviors?: string;
  favorite_things?: string;
  things_they_hate?: string;
  quirks_nobody_else_would_know?: string;
  genre?: string;
  /** @deprecated removed from lab intake */
  occasion?: string;
  /** @deprecated replaced by genre */
  vibe?: string;
}

export interface SongVariant {
  arc: 'funny' | 'heartfelt';
  title: string;
  style_prompt: string;
  lyrics: string;
}

/** Number of lyric/audio variants per order (funny + heartfelt). */
export const SONG_VARIANT_COUNT = 2;

export interface OrderRow {
  id: string;
  email: string;
  brief: Brief;
  status: OrderStatus;
  selected_variant: number | null;
  bundle: boolean;
  delivery_token: string;
  error: string | null;
  created_at: string;
}

export interface SongRow {
  id: string;
  order_id: string;
  variant: number;
  arc: string | null;
  title: string | null;
  lyrics: string | null;
  style_prompt: string | null;
  audio_path: string | null;
  preview_path: string | null;
  created_at: string;
}
