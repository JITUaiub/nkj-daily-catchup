import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const raw = process.env.DATABASE_URL;
const connectionString =
  raw && !raw.includes("[YOUR-PASSWORD]") && !raw.includes("[PASSWORD]")
    ? raw
    : undefined;

type Db = ReturnType<typeof drizzle<typeof schema>>;
let _db: Db | null = null;

function getDb(): Db | null {
  if (!connectionString) return null;
  if (!_db) {
    const pool = new Pool({ connectionString });
    _db = drizzle(pool, { schema }) as unknown as Db;
  }
  return _db;
}

export const db: Db | null = getDb();
export * from "./schema.js";
