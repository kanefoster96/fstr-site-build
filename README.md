# FSTR Cuts

Membership home barbering — website-first, mobile-first, PWA-ready. Every
integration (Stripe, Supabase, email, realtime) is **mocked behind a clean
adapter** with realistic seed data, so wiring the real services later is a
drop-in swap, not a rewrite.

> **One promise, everything serves it:** you never lose a cut you've paid for.
> Use it, or gift it.

## Run it locally

```bash
npm install
npm run dev
# http://localhost:3000
```

Start at **`/dev`** — the hidden control panel. From there you can:

- **Switch user** — become any seeded member, or Kane (the barber).
- **Advance the clock** — runs billing, token expiry, gift returns and the
  payment-failure timeline. Advance +60 to watch nudges and expiries fire.
- **Fire payment webhooks** — `invoice.paid` mints a token; try a member
  holding 2 tokens to watch billing pause instead of charging a full wallet.
- **Read the dev inbox** at `/dev/mail` — every "sent" email, real templates.

### A 2-minute demo walk

1. `/dev` → switch to a member with tokens → open `/me` (the wallet).
2. `/me/book` → note **Wed–Fri open, "77% full — Tuesday opens at 85%"**.
   Book a couple of slots and Tuesday reveals live (staged, demand-driven).
3. `/me/gift` → gift a token → open `/gift/<code>` to redeem it.
4. `/dev` → switch to **Kane (barber)** → `/admin` runs the day from a phone:
   `/admin/inbox` has a chat asking *"you free Thursday?"* — the slot picker is
   pre-filtered; tap a slot to offer it, the member accepts, token reserved.
5. `/admin/scan` → redeem a reserved token (RESERVED → REDEEMED).

## Booking rules

- **Hours:** Mon–Sat 9:30–14:30. Slots are **45 min + 15 min buffer** → starts
  at 09:30, 10:30, 11:30, 12:30, 13:30.
- **Staged opening:** Wed–Fri visible by default; when the open set is **85%
  booked**, Tuesday reveals, then Monday. Computed live from real bookings.
- **Saturday:** £35 priority spots (no token), **or** upgrade a token with +£10.
- **Tokens:** 60-day life, max 2 held, booking freezes the clock, gifting
  auto-returns at 14 days, cancelling membership keeps your tokens.

## Deploy to Vercel

Import the repo in Vercel — it auto-detects Next.js, no config needed.

The mock data store persists to disk locally (`./.data`) and to the OS temp dir
on Vercel (override with `FSTR_DATA_DIR`). On serverless, state is per-instance
and may reset when an instance recycles — expected for a mock demo. When the
real Supabase/Stripe are wired, state lives in Postgres and this caveat is gone.

## Architecture

| Concern      | Adapter (mock now → real later)                          |
| ------------ | -------------------------------------------------------- |
| Payments     | `src/lib/adapters/payments.ts` — Stripe-style webhooks   |
| Data         | `src/lib/data/db.ts` — in-memory + disk → Supabase/Postgres |
| Email        | `src/lib/adapters/mail.ts` → transactional provider      |
| Auth/session | `src/lib/auth.ts` → Supabase Auth                        |

The token state machine (`src/lib/engine/tokens.ts`) validates every transition
server-side and appends to `token_events` — the audit trail explains every
coin's life. Data model contract: `src/lib/types.ts`.

_Built with Next.js (App Router) + TypeScript + Tailwind._
