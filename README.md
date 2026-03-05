# WorkDay — Daily Work Management

Plan, track, and reflect on your workday. Rebuilt with a modern stack.

## Tech stack

| Layer        | Technology              |
| ------------ | ----------------------- |
| Build        | Vite 6                  |
| UI           | React 19 + TypeScript   |
| Styling      | Tailwind CSS v4         |
| Routing      | React Router v7         |
| Data / Auth  | Local MySQL             |
| Server state | TanStack React Query    |
| Animations   | Framer Motion           |
| Icons        | Lucide React            |

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — MySQL connection string (e.g. `mysql://user:password@localhost:3306/workday`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Google Calendar (optional)
   - `JWT_SECRET` — secret for session JWTs
   - `FRONTEND_URL` — e.g. `http://localhost:5173`
   - `API_URL` — e.g. `http://localhost:3001`

3. **Database**

   Run migrations (use existing Drizzle migrations; schema is in `server/db/schema.ts`):

   ```bash
   npm run db:migrate
   ```

   For new installs you may need to run `drizzle/0000_initial.sql` and `migrations/001_meetings_status_source_notes.sql` manually if needed.

## Development

- **Frontend only** (assumes API on port 3001):

  ```bash
  npm run dev
  ```

  App: http://localhost:5173. API requests are proxied to `/api` → `http://localhost:3001`. For auth (Google OAuth), the frontend links to the API origin in dev so cookies work.

- **API server only**:

  ```bash
  npm run server
  ```

  API: http://localhost:3001.

- **Both** (frontend + API):

  ```bash
  npm run dev:all
  ```

## Production build

```bash
 npm run build
 ```

Serves from `dist/`. Serve the API separately (e.g. run `node server/index.js` or use the same host and mount the API under `/api`).

## Deploying to Vercel

This app has two parts: a **Vite frontend** and an **Express API**. Vercel hosts the frontend; the API must run elsewhere (e.g. Railway or Render).

### Step 1: Push your code to GitHub

Make sure your repo is on GitHub (you already have this).

### Step 2: Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. **Import** your GitHub repo (e.g. `jitu-daily-catchup`).
4. Vercel will detect the app. Confirm:
   - **Framework Preset**: Vite (or leave as detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: leave as `.` (repo root).
5. **Environment variables** (optional for a first deploy): add any `VITE_*` vars you need at build time (e.g. `VITE_API_URL` — see Step 4). You can add the rest after the API is deployed.
6. Click **Deploy**. Wait for the build to finish.
7. You’ll get a URL like `https://your-project.vercel.app`. Visit it; the UI will load but API calls will fail until the API is deployed and configured.

### Step 3: Deploy the API (Railway or Render)

The Express server in `server/` cannot run as a long-lived process on Vercel. Deploy it to a Node host.

**Option A — Railway**

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select the same repo.
3. In project settings, set **Root Directory** to the repo root and **Start Command** to something like:  
   `npx tsx server/index.ts`  
   (or build first: `npm run build` then `node server/index.js` if you add a build step).
4. In **Variables**, add the same env vars your API needs:  
   `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (your Vercel URL, e.g. `https://your-project.vercel.app`), `API_URL` (the Railway URL you’ll get), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
5. Deploy. Copy the public URL (e.g. `https://your-app.railway.app`).

**Option B — Render**

1. Go to [render.com](https://render.com) and sign in.
2. **New** → **Web Service** → connect your repo.
3. **Build Command**: `npm install`  
   **Start Command**: `npx tsx server/index.ts`  
   **Environment**: add `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `API_URL`, Google OAuth vars, etc.
4. Under **Environment**, set `FRONTEND_URL` to your Vercel URL.
5. Deploy and copy the service URL.

### Step 4: Point the frontend to your API

1. In the **Vercel** project → **Settings** → **Environment Variables**.
2. Add:
   - **Name**: `VITE_API_URL`  
   - **Value**: your API base URL with no trailing slash (e.g. `https://your-app.railway.app`).
3. **Redeploy** the Vercel project (Deployments → … → Redeploy) so the new env var is applied.

Your app should now work: Vercel serves the UI and the UI calls your API using `VITE_API_URL`.

### Step 5: Google OAuth (if you use it)

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth client:

- Add **Authorized redirect URIs**:  
  `https://your-api-url.railway.app/api/auth/google/callback`  
  (or your Render URL).
- Add **Authorized JavaScript origins**:  
  `https://your-project.vercel.app`  
  (and optionally `http://localhost:5173` for local dev).

## Auth

- **Google OAuth**: Sign in at Settings or via “Connect Google Calendar” on Meetings. Callback runs on the API server; session is stored in an httpOnly cookie.
- **Session**: JWT in cookie; API uses it for `/api/auth/me` and protected routes.

## Project layout

- `src/` — Vite/React app (main.tsx, App, pages, components, contexts, lib/api)
- `server/` — Express API (auth, REST routes, Drizzle schema, MySQL)
- `drizzle/` — Migrations (schema lives in `server/db/schema.ts`; point Drizzle at that)
- `public/` — Static assets

Old Next.js/tRPC code under `src/app`, `src/server`, and some components is left in the repo but excluded from the build; you can remove it when no longer needed.
