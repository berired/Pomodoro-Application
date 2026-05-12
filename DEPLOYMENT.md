# Deployment Guide

This app is a **Next.js 15** monorepo — the frontend and all API routes (backend) are deployed together as a single unit. The database and auth are hosted on **Supabase**. The recommended host is **Vercel**.

---

## Stack Overview

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend + API routes | Next.js 15 (App Router) | Vercel |
| Database + Auth | Supabase (Postgres + Auth) | Supabase cloud |
| Spotify integration | Spotify Web API + Web Playback SDK | Spotify Developer Portal |

---

## Prerequisites

- A [Vercel](https://vercel.com) account connected to your GitHub/GitLab
- A [Supabase](https://supabase.com) project (already created)
- A [Spotify Developer](https://developer.spotify.com/dashboard) app (already created)
- Your production domain (assigned by Vercel, e.g. `your-app.vercel.app`, or a custom domain)

---

## Step 1 — Push your code to GitHub

If not already on GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create pomodoro-app --public --push --source=.
```

Or push to your existing remote:

```bash
git add .
git commit -m "Deploy"
git push origin main
```

---

## Step 2 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework will be auto-detected as **Next.js** — leave all build settings as default
4. **Do not deploy yet** — you must add environment variables first (Step 3)

---

## Step 3 — Set Environment Variables on Vercel

In the Vercel project → **Settings → Environment Variables**, add every variable below.

### Supabase

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key (**keep secret**) |

### App secrets

| Variable | Value |
|---|---|
| `CANVAS_TOKEN_SECRET` | A long random string — used to sign Spotify OAuth state and encrypt Canvas tokens. Generate one with `openssl rand -base64 32` |

### Spotify

| Variable | Value |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard → your app → Client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard → your app → Client Secret |
| `SPOTIFY_REDIRECT_URI` | `https://YOUR_DOMAIN/api/spotify/callback` |

Replace `YOUR_DOMAIN` with your actual Vercel domain (e.g. `pomodoro-app.vercel.app`).

> **Do not** copy `.env.local` values directly to production — regenerate all secrets and update the redirect URI.

---

## Step 4 — Run the Database Schema on Supabase

If the schema has not been applied yet:

1. Open your Supabase project → **SQL Editor**
2. Paste the full contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Click **Run**

This creates all tables (`users`, `classes`, `tasks`, `spotify_tokens`, `login_activity`) and sets up Row Level Security policies.

---

## Step 5 — Configure Supabase Auth

1. Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to your production domain:
   ```
   https://YOUR_DOMAIN
   ```
3. Under **Redirect URLs**, add:
   ```
   https://YOUR_DOMAIN/**
   ```
   This allows Supabase auth redirects to work on your production domain.

---

## Step 6 — Update the Spotify App Redirect URI

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Open your app → **Edit Settings**
3. Under **Redirect URIs**, add:
   ```
   https://YOUR_DOMAIN/api/spotify/callback
   ```
4. Save. The old `http://localhost:3000` URI can stay for local development.

> The `SPOTIFY_REDIRECT_URI` environment variable on Vercel must exactly match one of the URIs registered here.

---

## Step 7 — Deploy

Go back to Vercel and click **Deploy** (or trigger a redeploy if you already deployed without variables). Vercel will:

1. Install dependencies (`npm install`)
2. Build the app (`next build`)
3. Deploy all Next.js API routes as serverless functions automatically

No separate backend deployment step is needed — the API routes under `app/api/` are part of the same build.

---

## Step 8 — Verify the Deployment

Once live, check these in order:

- [ ] Visit `https://YOUR_DOMAIN` — landing page loads
- [ ] Register a new account — Supabase auth works
- [ ] Log in — session cookie set, redirected to dashboard
- [ ] Connect Spotify — OAuth flow redirects back without `?error=state_mismatch`
- [ ] Playlists load in the Spotify Web Player
- [ ] Playback controls work (requires Spotify Premium)

---

## Environment Variables Reference

Complete list of all variables the app needs in production:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
CANVAS_TOKEN_SECRET=<random 32-byte base64 string>

# Spotify
SPOTIFY_CLIENT_ID=<from Spotify dashboard>
SPOTIFY_CLIENT_SECRET=<from Spotify dashboard>
SPOTIFY_REDIRECT_URI=https://YOUR_DOMAIN/api/spotify/callback
```

---

## Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Your `.env.local` file already has all local values set. The Spotify redirect URI for local development is `http://127.0.0.1:3000/api/spotify/callback` (registered on the Spotify dashboard separately from the production URI).

---

## Notes

- **No separate backend server** — Next.js API routes (`app/api/**`) are deployed as Vercel serverless functions in the same deployment
- **Database migrations** — run `supabase/schema.sql` manually in the Supabase SQL editor whenever the schema changes; there is no migration runner configured yet
- **Spotify development mode** — your Spotify app may be in development mode, limiting it to 25 registered test users. To open it to all users, submit your app for a Spotify quota extension review from the developer dashboard
- **Image domains** — Spotify CDN domains (`i.scdn.co`, `mosaic.scdn.co`) are already allowlisted in `next.config.ts` for `next/image`
