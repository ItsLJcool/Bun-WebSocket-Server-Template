import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database("app.db");

// Optional: performance tweaks
sqlite.run(`
	PRAGMA journal_mode = WAL;
	PRAGMA synchronous = NORMAL;
`);

export const db = drizzle(sqlite);
export abstract class BaseDB {
  protected static db = db;
  static table: any;
}