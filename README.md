# Pet Song App — MVP

Personalized AI pet songs. Next.js 14 + Supabase + Claude + MiniMax music-2.6.
Payments and email are STUBBED (see TODOs) — this build is for proving the
core funnel and iterating on the lyric prompt.

## Setup (in order)

1. **Install:** `npm install`
2. **Supabase:** create a project, then run `supabase/migration.sql` in the SQL editor.
   It creates `orders` + `songs` tables and both storage buckets
   (`songs-full` private, `songs-previews` public). Verify the buckets exist in
   Storage — if the SQL insert into storage.buckets is blocked on your plan,
   create them manually with those exact names/visibility.
3. **Env:** copy `.env.example` → `.env.local` and fill in:
   - Supabase URL + anon key + service role key (Settings → API)
   - `ANTHROPIC_API_KEY` (console.anthropic.com)
   - `MINIMAX_API_KEY` (platform.minimax.io → Access)
   - `MINIMAX_MODEL=music-2.6-free` (flip to `music-2.6` for launch quality)
   - `ADMIN_PASSWORD` for /dashboard
4. **Run:** `npm run dev`
5. **First test:** open `http://localhost:3000/dev/test` and hit
   **Generate with sample brief**. This proves the entire pipeline
   (Claude → MiniMax → ffmpeg preview → storage) before you touch the funnel.
6. **Full funnel test:** `/` → Get Your Song → intake → TEST MODE payment →
   loader → previews → choose → delivery page.

## Where things live

- `lib/lyrics-prompt.ts` — **your songwriting system prompt (currently a blank
  shell — the pipeline still runs; Claude improvises until you write it).**
  This is the iterate-on-me file.
- `lib/claude.ts` — Claude call + the machine JSON contract (don't move the
  contract into the prompt file).
- `lib/minimax.ts` — MiniMax music_generation call (hex audio → Buffer).
- `lib/preview.ts` — ffmpeg 45s/96k preview clip.
- `lib/generation.ts` — pipeline orchestrator.
- `app/api/mock-payment` / `app/api/mock-upsell` — **TODO(stripe): the only
  files to replace when wiring real payments.** Mock-payment = future base-
  product webhook; mock-upsell = future +$10 webhook.
- `app/api/select` — has the **TODO(resend)** seam for the delivery email.

## Deploy notes (Vercel)

- Set all env vars in Vercel, redeploy, `vercel env pull .env.local` locally.
- `/api/generate` and `/api/regenerate` export `maxDuration = 300` — needs a
  plan that allows long function durations.
- `/dev/test` API is disabled in production automatically.

## Pricing wired into UI copy

$37 base (one song of choice) / +$10 unlock all three.
