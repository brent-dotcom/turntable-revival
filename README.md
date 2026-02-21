# 🎵 Turntable Revival

A social music game inspired by turntable.fm — create DJ rooms, play YouTube tracks, and let the crowd vote Awesome or Lame in real time.

Built with **Next.js 14**, **Supabase**, **YouTube IFrame API**, and **Tailwind CSS**.

---

## Features

- **Virtual DJ Rooms** — Create or join named rooms. Users queue up to DJ, pick YouTube videos, and everyone hears it synced via Supabase Realtime.
- **Awesome / Lame Voting** — Live vote counts. If Lame votes exceed 50% of listeners, the song auto-skips.
- **Pixel-Art Avatars** — Choose character type, color, and accessory (headphones, hat, glasses). Avatars bounce along the bottom when users vote Awesome.
- **Auth** — Email/username registration via Supabase Auth.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| Music | YouTube IFrame Player API |
| Styling | Tailwind CSS v3 |
| State | React hooks + Supabase Realtime subscriptions |
| Deployment | Vercel (recommended) |

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo>
cd turntable-revival
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. In **Authentication → Settings**, make sure email auth is enabled
4. (Optional) Disable email confirmation for local dev: **Auth → Email → Confirm email → Off**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase project under **Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
turntable-revival/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login form
│   │   └── signup/page.tsx         # Signup form
│   ├── api/
│   │   ├── rooms/route.ts          # POST: create room
│   │   ├── rooms/[roomId]/
│   │   │   └── skip/route.ts       # POST: skip song / advance queue
│   │   └── profile/route.ts        # PATCH: update profile
│   ├── rooms/
│   │   ├── page.tsx                # Room browser
│   │   ├── create/page.tsx         # Create room form
│   │   └── [roomId]/
│   │       ├── page.tsx            # Server shell (SSR metadata)
│   │       └── RoomClient.tsx      # Client room UI
│   ├── profile/
│   │   ├── page.tsx                # Server auth check
│   │   └── ProfileClient.tsx       # Avatar customizer + account
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── globals.css
├── components/
│   ├── avatar/
│   │   ├── Avatar.tsx              # Pixel-art SVG avatar renderer
│   │   └── AvatarCustomizer.tsx    # Avatar config UI
│   ├── room/
│   │   ├── AvatarRow.tsx           # Bottom avatar strip with bounce
│   │   ├── DJQueue.tsx             # Queue display + join/leave
│   │   ├── RoomHeader.tsx          # Room name + listener count
│   │   ├── SongPicker.tsx          # YouTube URL/ID input + preview
│   │   ├── VoteBar.tsx             # Awesome/Lame buttons + bar
│   │   └── YouTubePlayer.tsx       # YouTube IFrame API wrapper
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
├── hooks/
│   └── useRoom.ts                  # All room state + realtime logic
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client
│   │   └── middleware.ts           # Auth session refresh
│   └── utils.ts                    # cn, slugify, YouTube helpers
├── middleware.ts                   # Route protection
├── supabase/
│   └── schema.sql                  # Full DB schema + RLS policies
├── types/
│   └── index.ts                    # TypeScript types
└── .env.local.example
```

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | User profile + avatar config, created automatically on signup |
| `rooms` | DJ rooms with current playback state (video ID + start timestamp) |
| `room_members` | Who is currently in a room (presence via heartbeat) |
| `dj_queue` | Ordered queue of users waiting to DJ |
| `votes` | Awesome/Lame votes per user per video per room |

### Key Design Decisions

- **Sync via timestamp**: `rooms.video_started_at` stores when the current video began. Joiners compute `elapsed = now - video_started_at` and seek the YouTube player to that position.
- **Lame auto-skip**: The client computes lame vote percentage in real time. When it crosses the threshold (default 50%), it calls `POST /api/rooms/[roomId]/skip`. The server verifies the threshold before advancing the queue.
- **Presence**: `room_members` rows are created on join and deleted on leave. A heartbeat updates `last_seen_at` every 15s. Stale members (older than 60s) could be cleaned up via a Supabase Edge Function (not included in v1).
- **Queue advance**: The `advance_dj_queue` SQL function atomically removes the next DJ from the queue and sets them as `current_dj_id`.

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in your Vercel project settings.

---

## Known Limitations / Future Work

- **Listener count** — `rooms.listener_count` is not auto-updated in v1. Consider a Supabase DB trigger or Edge Function counting `room_members` rows.
- **Song title auto-fetch** — The song picker lets users manually type the title. A YouTube Data API v3 key could auto-fill it. Add `YOUTUBE_API_KEY` to `.env.local` and implement a fetch in `SongPicker.tsx`.
- **Stale presence cleanup** — Members who close the tab without triggering the `beforeunload` cleanup will linger in `room_members`. A scheduled Edge Function deleting rows where `last_seen_at < now - 60s` would fix this.
- **Room permissions** — Currently any authenticated user can call the skip endpoint if the lame threshold is reached. Rate-limiting could be added.
- **Mobile YouTube** — iOS Safari requires a user gesture to autoplay audio. The YouTube IFrame API handles this, but a "tap to unmute" UX may be needed.

---

## License

MIT
