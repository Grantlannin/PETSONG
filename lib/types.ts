export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'generating'
  | 'preview_ready'
  | 'delivered'
  | 'failed';

export interface Brief {
  pet_name: string;
  nickname?: string;
  pet_type: string;
  breed?: string;
  quirks: string;
  physical_detail?: string;
  occasion: string;
  emotional_anchor?: string;
  vibe?: string;
}

export interface SongVariant {
  arc: 'funny' | 'sweet' | 'tearjerker';
  title: string;
  style_prompt: string;
  lyrics: string;
}

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
