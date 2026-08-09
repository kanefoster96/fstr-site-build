import "server-only";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type { DataStore } from "../types";
import { buildSeed } from "./seed";

/**
 * DataAdapter (mock Supabase): an in-memory store seeded from a deterministic
 * generator and persisted to disk so state survives dev reloads. Every read
 * and write goes through here; swapping in real Supabase is a matter of
 * re-implementing these functions against Postgres — callers never change.
 */

// Locally we persist to ./.data. On serverless hosts (e.g. Vercel) the project
// dir is read-only, so fall back to the OS temp dir, which is writable and
// stays warm within an instance. Override with FSTR_DATA_DIR if needed. State
// is a mock demo store — it may reset when a serverless instance recycles.
const DATA_DIR =
  process.env.FSTR_DATA_DIR ||
  (process.env.VERCEL ? path.join(os.tmpdir(), "fstr-cuts") : path.join(process.cwd(), ".data"));
const STORE_PATH = path.join(DATA_DIR, "store.json");

// Cache across hot reloads in dev.
const g = globalThis as unknown as { __fstrStore?: DataStore };

async function readFromDisk(): Promise<DataStore | null> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as DataStore;
  } catch {
    return null;
  }
}

async function writeToDisk(store: DataStore): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // In read-only deploys we simply keep the in-memory copy.
  }
}

export async function getDb(): Promise<DataStore> {
  if (g.__fstrStore) return g.__fstrStore;
  const fromDisk = await readFromDisk();
  const store = fromDisk ?? buildSeed();
  g.__fstrStore = store;
  if (!fromDisk) await writeToDisk(store);
  return store;
}

/** Persist the current in-memory store to disk. */
export async function saveDb(): Promise<void> {
  if (g.__fstrStore) await writeToDisk(g.__fstrStore);
}

/** Run a mutation against the store and persist it atomically-ish. */
export async function mutate<T>(fn: (db: DataStore) => T): Promise<T> {
  const db = await getDb();
  const result = fn(db);
  await writeToDisk(db);
  return result;
}

/** Wipe back to a fresh seed (used by /dev "reset"). */
export async function resetDb(): Promise<DataStore> {
  const store = buildSeed();
  g.__fstrStore = store;
  await writeToDisk(store);
  return store;
}

// -- convenience selectors ---------------------------------------------------

export async function now(): Promise<string> {
  return (await getDb()).clock.now;
}
