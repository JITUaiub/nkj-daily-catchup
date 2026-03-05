import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
let _db: DbInstance | null = null;

function getDb(): DbInstance | null {
  if (!connectionString) return null;
  if (!_db) {
    try {
      const client = mysql.createPool(connectionString);
      _db = drizzle(client, { schema, mode: "default" }) as unknown as DbInstance;
    } catch {
      return null;
    }
  }
  return _db;
}

export const db = getDb();
export * from "./schema";
