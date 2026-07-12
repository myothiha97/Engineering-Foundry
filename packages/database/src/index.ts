import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is required");
  const client = postgres(url, { max: 10, idle_timeout: 20 });
  return drizzle(client, { schema });
}
export { schema };
