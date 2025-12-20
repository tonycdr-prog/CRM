import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const devBypassEnabled =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_AUTH_BYPASS?.toLowerCase() === "true";

const databaseUrl = process.env.DATABASE_URL;

function createNoDbProxy(): NodePgDatabase<typeof schema> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Database unavailable in dev auth bypass mode");
      },
    },
  ) as unknown as NodePgDatabase<typeof schema>;
}

let pool: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema>;
let databaseAvailable = true;

if (!databaseUrl) {
  if (devBypassEnabled) {
    databaseAvailable = false;
    dbInstance = createNoDbProxy();
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
} else {
  try {
    pool = new Pool({ connectionString: databaseUrl });
    dbInstance = drizzle(pool, { schema });
  } catch (error) {
    if (devBypassEnabled) {
      console.warn(
        "Database initialization failed; continuing in dev auth bypass mode",
      );
      databaseAvailable = false;
      pool = null;
      dbInstance = createNoDbProxy();
    } else {
      throw error;
    }
  }
}

export const isDatabaseAvailable = databaseAvailable;
export { pool };
export const db = dbInstance;
