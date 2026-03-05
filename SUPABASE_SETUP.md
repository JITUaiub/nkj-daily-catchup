# Supabase setup

1. **Create tables in Supabase (schema)**  
   In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, run the contents of `supabase-schema.sql`.  
   This file is safe to re-run; it uses `IF NOT EXISTS` for types and tables.

2. **Attach triggers (optional but recommended)**  
   Still in the SQL Editor, run `supabase-triggers.sql`.  
   This adds `updated_at` triggers so timestamps stay fresh when you edit rows.

3. **Seed demo data (optional)**  
   To get a demo user, projects, and a few starter tasks, run `supabase-seed.sql`.

4. **Set Supabase credentials in `.env`**  
   In Dashboard → **Project Settings** → **Database / API**, copy values into `.env`:
   ```env
   SUPABASE_URL=your-project-url
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
   ```

5. **Run the app**  
   ```bash
   npm run dev:all
   ```  
   Frontend: http://localhost:5173 — API: http://localhost:3001
