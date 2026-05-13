# Pomodoro App

A student productivity web app built with Next.js 15, Supabase, and the Spotify Web Playback SDK. Styled as a 90s CRT terminal — phosphor green on black, ASCII borders, scanline effects.

## Features

- **Pomodoro timer** — focus/break sessions with customizable intervals and a PC-speaker alarm on completion
- **PiP timer** — floating draggable timer widget that appears when the timer is running and you navigate away; disappears when you return home
- **Spotify Web Player** — browse playlists, control playback, and keep music running while switching pages (state persists across navigation)
- **Task & class management** — schedule tasks and recurring classes with a calendar view
- **Canvas LMS integration** — pull upcoming assignments from Canvas
- **Login activity heatmap** — visualize study consistency over 52 weeks
- **Authentication** — email/password auth via Supabase
- **Ambient sound** — synthesized PC fan/HDD whirr on the landing page (Web Audio API, no audio files)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (Postgres + Auth) |
| Music | Spotify Web API + Web Playback SDK |
| Audio | Web Audio API (synthesized) |
| Deployment | Vercel |

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App secrets
CANVAS_TOKEN_SECRET=your_random_secret

# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
```

### 3. Apply the database schema

Run the SQL in `supabase/schema.sql` in your Supabase project's SQL editor.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment guide covering Vercel, Supabase, and Spotify configuration.
