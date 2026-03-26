import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
}) as ReturnType<typeof drizzle<typeof schema>>;
