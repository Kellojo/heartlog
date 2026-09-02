import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";
import { building } from "$app/environment";
import fs from "node:fs";
import path from "node:path";

const dbPath = env.DATABASE_URL || "local.db";

if (!building) {
  const dir = path.dirname(dbPath);
  if (dir && dir !== ".") {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const client = new Database(dbPath);
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");

export const db = drizzle(client, { schema });

if (!building) {
  migrate(db, { migrationsFolder: "drizzle" });
}