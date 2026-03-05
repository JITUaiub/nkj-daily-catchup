# Supabase setup

1. **Create tables in Supabase**  
   In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, run the contents of `supabase-schema.sql` (one-time).

2. **Set database password in `.env`**  
   In Dashboard → **Project Settings** → **Database**, copy the **Connection string** (URI) and replace `[YOUR-PASSWORD]` in `.env` with your database password:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.qqusishwqqdpdokezsbt.supabase.co:5432/postgres
   ```

3. **Run the app**  
   ```bash
   npm run dev:all
   ```  
   Frontend: http://localhost:5173 — API: http://localhost:3001

Without a valid `DATABASE_URL`, the app still runs but uses no database (empty lists).
