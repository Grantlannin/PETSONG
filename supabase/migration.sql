-- Pet Song App schema. Run in Supabase SQL editor.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  brief jsonb not null,
  status text not null default 'pending', -- pending | paid | generating | preview_ready | delivered | failed
  selected_variant int,
  bundle boolean not null default false,
  delivery_token uuid not null default gen_random_uuid(),
  error text,
  created_at timestamptz not null default now()
);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant int not null,               -- 1=funny, 2=sweet, 3=tearjerker
  arc text,
  title text,
  lyrics text,
  style_prompt text,
  audio_path text,                    -- songs-full bucket path
  preview_path text,                  -- songs-previews bucket path
  created_at timestamptz not null default now(),
  unique (order_id, variant)
);

create index if not exists songs_order_idx on songs(order_id);
create index if not exists orders_token_idx on orders(delivery_token);

-- Lock tables down: the app only touches these via the service-role key in API routes.
alter table orders enable row level security;
alter table songs enable row level security;

-- Storage buckets (create in Dashboard -> Storage, or via SQL below):
--   songs-full      : PRIVATE  (full MP3s, served via signed URLs after selection)
--   songs-previews  : PUBLIC   (45s clips)
insert into storage.buckets (id, name, public)
  values ('songs-full', 'songs-full', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('songs-previews', 'songs-previews', true)
  on conflict (id) do nothing;
