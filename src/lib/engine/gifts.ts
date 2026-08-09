import "server-only";
import type { DataStore, Gift, Token } from "../types";
import { addDays } from "../format";
import { logToken, TokenError } from "./tokens";

/** Gifting (§4.6). Never a risk: unredeemed at day 14 returns to sender with
 *  whatever remains of the original 60-day life. */

let giftCounter = 0;

function giftCode(): string {
  // Human-readable, engraveable in mono. Avoids ambiguous chars.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const seed = Date.now() + ++giftCounter * 7919;
  let n = seed;
  for (let i = 0; i < 3; i++) {
    s += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length) + 31;
  }
  return `BRASS-${s}`;
}

export function giftToken(
  db: DataStore,
  tokenId: string,
  fromMemberId: string,
  toContact: string,
): Gift {
  const t = db.tokens.find((x) => x.id === tokenId);
  if (!t) throw new TokenError(`Token ${tokenId} not found`);
  // Live tokens and expired (gift-only) tokens can both be gifted — an expired
  // cut is never lost, it just goes silver and giftable.
  if (t.state !== "ISSUED" && t.state !== "EXPIRED") {
    throw new TokenError("Only a live or gift-only token can be gifted.");
  }
  if (t.member_id !== fromMemberId) throw new TokenError("That token isn't yours to gift.");

  const id = `gift_${Date.now().toString(36)}_${giftCounter}`;
  const gift: Gift = {
    id,
    token_id: t.id,
    code: giftCode(),
    from_member_id: fromMemberId,
    to_contact: toContact,
    created_at: db.clock.now,
    expires_at: addDays(db.clock.now, db.settings.rules.gift_life_days),
    redeemed_at: null,
    returned_at: null,
    opened_at: null,
    status: "sent",
  };
  db.gifts.push(gift);
  t.state = "GIFTED";
  t.gift_id = id;
  logToken(db, t.id, "gifted", fromMemberId, { code: gift.code, to: toContact });
  return gift;
}

export function findGiftByCode(db: DataStore, code: string): Gift | undefined {
  return db.gifts.find((g) => g.code.toUpperCase() === code.toUpperCase());
}

export function openGift(db: DataStore, code: string): Gift | undefined {
  const g = findGiftByCode(db, code);
  if (g && !g.opened_at && g.status === "sent") {
    g.opened_at = db.clock.now;
    g.status = "opened";
  }
  return g;
}

/** Day-14 lapse: return unredeemed gifts to sender, token back to ISSUED with
 *  whatever remains of its original expiry (§4.6). */
export function returnLapsedGifts(db: DataStore): string[] {
  const returned: string[] = [];
  for (const g of db.gifts) {
    const outstanding = g.status === "sent" || g.status === "opened";
    if (outstanding && new Date(db.clock.now) >= new Date(g.expires_at)) {
      const t = db.tokens.find((x) => x.id === g.token_id);
      if (t && t.state === "GIFTED") {
        t.state = "ISSUED"; // keeps its original expires_at (remaining 60)
        t.gift_id = null;
        g.returned_at = db.clock.now;
        g.status = "returned";
        logToken(db, t.id, "gift_returned", "system", { gift_id: g.id });
        returned.push(t.id);
      }
    }
  }
  return returned;
}

/** Recipient books the gifted token → RESERVED (handled with booking engine). */
export function markGiftRedeemed(db: DataStore, giftId: string): Gift | undefined {
  const g = db.gifts.find((x) => x.id === giftId);
  if (g) {
    g.redeemed_at = db.clock.now;
    g.status = "booked";
  }
  return g;
}
