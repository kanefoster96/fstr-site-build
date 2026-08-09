import "server-only";
import { getDb, mutate } from "./data/db";
import type { Member, Role } from "./types";

/**
 * Mock session. A seeded user (or the barber) is chosen from /dev. Structured
 * so Supabase Auth slots in later: replace these reads/writes with the real
 * session lookup and nothing else changes.
 */

export interface Session {
  member: Member | null;
  role: Role;
  isBarber: boolean;
}

export async function getSession(): Promise<Session> {
  const db = await getDb();
  const member = db.session.member_id
    ? db.members.find((m) => m.id === db.session.member_id) ?? null
    : null;
  const role = db.session.role;
  return { member, role, isBarber: role === "barber" };
}

export async function setSession(memberId: string | null, role: Role): Promise<void> {
  await mutate((db) => {
    db.session.member_id = memberId;
    db.session.role = role;
  });
}
