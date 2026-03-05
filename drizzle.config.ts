import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Optional: local Postgres connection for Drizzle tooling only.
    // The runtime app talks to Supabase via @supabase/supabase-js instead of a DATABASE_URL.
    url: "postgresql://postgres:password@localhost:54322/postgres",
  },
});
