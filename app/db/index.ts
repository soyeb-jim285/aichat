import { drizzle } from "drizzle-orm/neon-http";
import { neon } from '@neondatabase/serverless';
import * as schema from "./schema";
import { env } from "@/env";

// Create neon client
const sql = neon(env.DATABASE_URL);

// Create drizzle client with schema
export const db = drizzle(sql, { schema });

export * from "./schema";