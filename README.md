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

## Auth

- **Google OAuth**: Sign in at Settings or via “Connect Google Calendar” on Meetings. Callback runs on the API server; session is stored in an httpOnly cookie.
- **Session**: JWT in cookie; API uses it for `/api/auth/me` and protected routes.

## Project layout

- `src/` — Vite/React app (main.tsx, App, pages, components, contexts, lib/api)
- `server/` — Express API (auth, REST routes, Drizzle schema, MySQL)
- `drizzle/` — Migrations (schema lives in `server/db/schema.ts`; point Drizzle at that)
- `public/` — Static assets

Old Next.js/tRPC code under `src/app`, `src/server`, and some components is left in the repo but excluded from the build; you can remove it when no longer needed.
