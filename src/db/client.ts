import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../config";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: config.database.url,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
