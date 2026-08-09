import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Password hashing for the mock auth. Real, salted scrypt hashes — never
 * plaintext — stored as "salt:hash" on the member. Swaps cleanly for Supabase
 * Auth later; nothing else needs to change.
 */
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEYLEN);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Minimum viable password rule for sign-up. */
export function passwordIssue(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  return null;
}
