import type {
  DataStore,
  Member,
  Subscription,
  Token,
  Booking,
  Slot,
  Gift,
  Chat,
  Message,
  TokenEvent,
  WaitlistEntry,
  Settings,
  AvailabilityFlag,
  Pence,
} from "../types";
import { addDays } from "../format";

/**
 * Deterministic seed. The dev clock starts mid-month (§12) so nudges (day
 * 10/20/50), expiries and billing cycles are all imminently demonstrable.
 * No Math.random / Date.now here — everything derives from NOW so a fresh
 * store is byte-identical every time, and the demo walkthrough is stable.
 */
export const NOW = "2026-08-15T10:00:00.000Z";

// Small seeded PRNG (mulberry32) for stable "randomness".
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260815);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const FOUNDING_50: Pence = 2500;
const BAND_2: Pence = 2500;
const BAND_3: Pence = 3000;

function defaultSettings(): Settings {
  return {
    pricing_ladder: [
      { from_seat: 1, to_seat: 50, price: FOUNDING_50, label: "Founding 50", note: "£25 locked while continuously subscribed" },
      { from_seat: 51, to_seat: 100, price: BAND_2, label: "Second 50", note: "£25, reviewed annually" },
      { from_seat: 101, to_seat: 130, price: BAND_3, label: "Final 30", note: "£30" },
    ],
    current_rate: BAND_3,
    waitlist_price: 3500,
    total_seats: 130,
    weekday_daily_cap: 5,
    weekend_slots_max: 5,
    weekend_day: "saturday",
    open_days: [1, 2, 3, 4, 5],
    day_start: "09:30",
    day_end: "14:30",
    slot_length_mins: 45,
    slot_buffer_mins: 15,
    fill_order: [5, 4, 3, 2, 1], // Fri→Mon; Friday is the anchor
    reveal_threshold: 0.85,
    last_minute_days: 3,
    plans: [2, 3, 4, 5, 6],
    default_cycle_weeks: 4,
    rules: {
      token_life_days: 60,
      max_held: 5,
      active_display: 2,
      store_cap: 3,
      plan_prompt_threshold: 3,
      gift_life_days: 14,
      cancel_cutoff_hours: 24,
      cancel_extend_days: 7,
      member_release_weeks: 2,
      oneoff_window_days: 7,
      weekend_early_access_hours: 48,
      reclaim_window_days: 30,
      retry_days: [3, 5, 7],
      pause_membership_day: 10,
      liability_amber: 40,
      liability_red: 60,
      wait_to_book_flag_days: 10,
    },
    flags: {
      pause_holding_fee: false,
      trial_offer: false,
      three_day_opening: false,
    },
    weekend_upgrade_surcharge: 1000,
    weekend_public_price: 3500,
    oneoff_price: 3500,
    beard_addon_price: 800,
    pause_holding_fee: 500,
  };
}

const FIRST = ["Jordan", "Callum", "Marcus", "Danny", "Aaron", "Liam", "Reece", "Kyle", "Nathan", "Sean", "Tom", "Josh", "Ryan", "Dean", "Craig", "Michael", "Adam", "Chris", "Lewis", "Scott", "Gary", "Paul", "Anthony", "Jamie", "Ben", "Luke", "Rob", "Dale", "Connor", "Elliot", "Sam", "Joe", "Nick", "Harry", "George", "Matt", "Ash", "Rory", "Finn", "Kane"];
const LAST = ["Robson", "Charlton", "Milburn", "Shearer", "Beardsley", "Gascoigne", "Waddle", "Keegan", "Bell", "Ferdinand", "Given", "Dyer", "Solano", "Ameobi", "Taylor", "Nolan", "Carroll", "Coloccini", "Krul", "Cabaye", "Sissoko", "Perch", "Williamson", "Simpson", "Tiote", "Gutierrez", "Best", "Lovenkrands", "Barton", "Smith", "Hall", "Ellison", "Forster", "Elliot", "Anita", "Obertan", "Marveaux", "Santon", "Haidara", "Yanga"];

const AVAIL: AvailabilityFlag[][] = [
  ["weekday_day"],
  ["weekday_day", "evening"],
  ["evening"],
  ["weekday_day", "weekend"],
  ["evening", "weekend"],
];

const CUTS = ["Skin fade, scissor top", "Number 2 all over", "Textured crop", "Classic taper", "Mid fade + beard tidy", "Short back and sides", "Buzz + line-up", "Scissor cut, natural"];

function push<T>(arr: T[], item: T): T {
  arr.push(item);
  return item;
}

export function buildSeed(): DataStore {
  const settings = defaultSettings();
  const members: Member[] = [];
  const subscriptions: Subscription[] = [];
  const tokens: Token[] = [];
  const bookings: Booking[] = [];
  const slots: Slot[] = [];
  const gifts: Gift[] = [];
  const chats: Chat[] = [];
  const messages: Message[] = [];
  const token_events: TokenEvent[] = [];
  const waitlist: WaitlistEntry[] = [];

  let tokenSeq = 0;
  let eventSeq = 0;
  const priceForSeat = (seat: number): Pence =>
    settings.pricing_ladder.find((b) => seat >= b.from_seat && seat <= b.to_seat)?.price ?? BAND_3;

  const logEvent = (
    token_id: string,
    event: TokenEvent["event"],
    actor: string,
    timestamp: string,
    metadata?: Record<string, unknown>,
  ) => {
    token_events.push({ id: `ev_${++eventSeq}`, token_id, event, actor, timestamp, metadata });
  };

  const mintToken = (
    member_id: string,
    issued_at: string,
    source: Token["source"] = "subscription",
  ): Token => {
    const id = `tok_${++tokenSeq}`;
    const t: Token = {
      id,
      member_id,
      state: "ISSUED",
      issued_at,
      expires_at: addDays(issued_at, settings.rules.token_life_days),
      frozen_at: null,
      booking_id: null,
      gift_id: null,
      source,
    };
    tokens.push(t);
    logEvent(id, "issued", "system", issued_at, { source });
    return t;
  };

  // The barber (role-gated admin).
  members.push({
    id: "barber",
    name: "Kane",
    email: "kane@fstrcuts.co.uk",
    phone: "07700 900000",
    avatar_url: null,
    availability_profile: [],
    joined_at: addDays(NOW, -400),
    seat_number: null,
    status: "active",
    role: "barber",
    usual_cut: undefined,
  });

  // ~40 members across personas. Seats 1..44 filled (some churn frees a few).
  const SEATS = 44;
  for (let i = 0; i < SEATS; i++) {
    const seat = i + 1;
    const first = FIRST[i % FIRST.length];
    const last = LAST[i % LAST.length];
    const id = `mem_${seat}`;
    const joined = addDays(NOW, -(30 + Math.floor(rand() * 300)));
    const streak = Math.max(1, Math.floor((Date.parse(NOW) - Date.parse(joined)) / (30 * 864e5)));
    const badges: string[] = [];
    if (seat <= 50) badges.push("Founding Member");
    if (streak >= 6) badges.push("6 Months");
    if (streak >= 12) badges.push("12 Months");

    const m: Member = {
      id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `07700 ${String(900100 + seat)}`,
      avatar_url: null,
      availability_profile: pick(AVAIL),
      joined_at: joined,
      seat_number: seat,
      status: "active",
      role: "member",
      usual_cut: pick(CUTS),
      notes: seat % 7 === 0 ? "Leaves a little length on top." : undefined,
      streak_months: streak,
      badges,
    };
    members.push(m);

    const billingDay = 1 + (seat % 27);
    subscriptions.push({
      id: `sub_${seat}`,
      member_id: id,
      tier: "monthly",
      price_locked: priceForSeat(seat),
      billing_day: billingDay,
      cycle_weeks: 4,
      last_billing_at: addDays(NOW, -(7 + (seat % 21))),
      next_billing_at: addDays(NOW, 1 + (seat % 21)),
      plan_locked_until_next_billing: false,
      status: "active",
      started_at: joined,
      cancel_effective_at: null,
      reclaim_deadline: null,
      past_due_since: null,
      retry_count: 0,
    });

    // Give most members a current token; vary the state across the wallet.
    const issued = addDays(NOW, -(Math.floor(rand() * 40)));
    const tok = mintToken(id, issued);

    // A share of tokens are further along their life for demo variety.
    const roll = rand();
    if (roll < 0.12) {
      // near-expiry ISSUED (nudge candidates) — issued ~52 days ago
      tok.issued_at = addDays(NOW, -52);
      tok.expires_at = addDays(tok.issued_at, 60);
    }
  }

  // Publish Mon–Sat slots. Hours 9:30–14:30, 45-min slots on the hour
  // (45 + 15 buffer): 09:30, 10:30, 11:30, 12:30, 13:30.
  let slotSeq = 0;
  const openDays = settings.open_days;
  const TIMES = ["09:30", "10:30", "11:30", "12:30", "13:30"];
  for (let d = -14; d <= 21; d++) {
    const day = new Date(Date.parse(NOW) + d * 864e5);
    const dow = day.getUTCDay();
    const isWeekend = dow === 6; // Saturday (default weekend day)
    if (!isWeekend && !openDays.includes(dow)) continue;
    TIMES.forEach((hm) => {
      const [h, mn] = hm.split(":").map(Number);
      const starts = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, mn)).toISOString();
      const release = addDays(starts, -14);
      slots.push({
        id: `slot_${++slotSeq}`,
        starts_at: starts,
        duration_mins: 45,
        day_type: isWeekend ? "weekend" : "weekday",
        published: true,
        release_at: release,
        // Saturday: members get 48h early access (token + £10) before it goes
        // public at £35. Weekdays: members get first look for 7 days.
        member_only_until: isWeekend ? addDays(starts, -2) : addDays(release, 7),
        capacity: 1,
        booked: false,
      });
    });
  }

  // 6 weeks of completed booking history — consume some past tokens as REDEEMED.
  let bookingSeq = 0;
  const pastSlots = slots.filter((s) => Date.parse(s.starts_at) < Date.parse(NOW));
  pastSlots.forEach((s, idx) => {
    if (rand() < 0.55) {
      const m = members[1 + (idx % SEATS)];
      const issued = addDays(s.starts_at, -10);
      const tok = mintToken(m.id, issued);
      tok.state = "REDEEMED";
      tok.frozen_at = addDays(s.starts_at, -2);
      tok.booking_id = `bk_${++bookingSeq}`;
      logEvent(tok.id, "reserved", m.id, addDays(s.starts_at, -2));
      logEvent(tok.id, "redeemed", "barber", s.starts_at, { via: "qr" });
      s.booked = true;
      bookings.push({
        id: tok.booking_id,
        member_id: m.id,
        token_id: tok.id,
        slot_id: s.id,
        kind: "member",
        status: "completed",
        price_paid: 0,
        created_via: rand() < 0.2 ? "chat" : "calendar",
        created_at: addDays(s.starts_at, -3),
        beard_addon: rand() < 0.3,
      });
    }
  });

  // Persona: a no-show (token REDEEMED with reason).
  {
    const m = members[3];
    const s = pastSlots[2];
    if (s) {
      const tok = mintToken(m.id, addDays(s.starts_at, -8));
      tok.state = "REDEEMED";
      tok.frozen_at = addDays(s.starts_at, -1);
      tok.booking_id = `bk_${++bookingSeq}`;
      logEvent(tok.id, "reserved", m.id, addDays(s.starts_at, -5));
      logEvent(tok.id, "redeemed", "system", s.starts_at, { reason: "no_show" });
      bookings.push({
        id: tok.booking_id, member_id: m.id, token_id: tok.id, slot_id: s.id,
        kind: "member", status: "no_show", price_paid: 0, created_via: "calendar",
        created_at: addDays(s.starts_at, -5), reason: "No-show — clock stopped, token spent.",
      });
    }
  }

  // Persona: new dad banking tokens (holds 3 → sees the "slow your plan" nudge).
  {
    const m = members[6];
    m.notes = "New dad — banking tokens, tight on time.";
    for (let k = 0; k < 2; k++) mintToken(m.id, addDays(NOW, -(5 + k * 3)));
    // (already has one auto token from the loop → 3 total held)
  }

  // Persona: a collector holding the full 5, with billing imminent — demoing
  // "your account's full, switch to a longer plan?".
  {
    const m = members[9];
    m.notes = "Collector — wallet's full, billing due.";
    const sub = subscriptions.find((s) => s.member_id === m.id)!;
    sub.next_billing_at = addDays(NOW, 1);
    sub.last_billing_at = addDays(NOW, -27);
    // ensure exactly 5 held: count current ISSUED/GIFTED, top up
    const held = () => tokens.filter((t) => t.member_id === m.id && (t.state === "ISSUED" || t.state === "GIFTED")).length;
    while (held() < 5) mintToken(m.id, addDays(NOW, -(1 + held())));
  }

  // Persona: serial gifter + a gift in flight (GIFTED, code visible).
  {
    const giver = members[8];
    giver.notes = "Serial gifter — always sending mates a cut.";
    const tok = mintToken(giver.id, addDays(NOW, -20));
    tok.state = "GIFTED";
    const giftId = "gift_live_1";
    tok.gift_id = giftId;
    logEvent(tok.id, "gifted", giver.id, addDays(NOW, -6), { code: "BRASS-7Q2" });
    gifts.push({
      id: giftId, token_id: tok.id, code: "BRASS-7Q2", from_member_id: giver.id,
      to_contact: "Marra Dave", created_at: addDays(NOW, -6), expires_at: addDays(NOW, 8),
      redeemed_at: null, returned_at: null, opened_at: addDays(NOW, -5), status: "opened",
    });
  }

  // Persona: skint student who gifts (a gift about to lapse — expiring in 3 days).
  {
    const student = members[10];
    student.notes = "Student — skint, generous.";
    const tok = mintToken(student.id, addDays(NOW, -40));
    tok.state = "GIFTED";
    const giftId = "gift_live_2";
    tok.gift_id = giftId;
    logEvent(tok.id, "gifted", student.id, addDays(NOW, -11));
    gifts.push({
      id: giftId, token_id: tok.id, code: "BRASS-3XK", from_member_id: student.id,
      to_contact: "flatmate@example.com", created_at: addDays(NOW, -11), expires_at: addDays(NOW, 3),
      redeemed_at: null, returned_at: null, opened_at: null, status: "sent",
    });
  }

  // Persona: night-shift worker (evening-only availability, uses chat).
  {
    const nightMember = members[12];
    nightMember.notes = "Night shifts — evenings only, prefers to message.";
    nightMember.availability_profile = ["evening"];
  }

  // A booked upcoming member slot (RESERVED, visible on booking card).
  {
    const m = members[1];
    const upcoming = slots.find((s) => Date.parse(s.starts_at) > Date.parse(NOW) && !s.booked && s.day_type === "weekday");
    if (upcoming) {
      const tok = tokens.find((t) => t.member_id === m.id && t.state === "ISSUED");
      if (tok) {
        tok.state = "RESERVED";
        tok.frozen_at = NOW;
        tok.booking_id = `bk_${++bookingSeq}`;
        logEvent(tok.id, "reserved", m.id, NOW);
        logEvent(tok.id, "frozen", "system", NOW);
        upcoming.booked = true;
        bookings.push({
          id: tok.booking_id, member_id: m.id, token_id: tok.id, slot_id: upcoming.id,
          kind: "member", status: "confirmed", price_paid: 0, created_via: "calendar",
          created_at: NOW, beard_addon: false,
        });
      }
    }
  }

  // A pending prebook (holding a future slot, waiting on next billing).
  {
    const m = members[2];
    const future = slots.find((s) => Date.parse(s.starts_at) > Date.parse(addDays(NOW, 16)) && !s.booked);
    if (future) {
      future.booked = true;
      bookings.push({
        id: `bk_${++bookingSeq}`, member_id: m.id, token_id: null, slot_id: future.id,
        kind: "prebook_pending", status: "pending", price_paid: 0, created_via: "prebook",
        created_at: NOW,
      });
    }
  }

  // A failed payment mid-retry (past_due, retry in progress).
  {
    const m = members[5];
    const sub = subscriptions.find((s) => s.member_id === m.id)!;
    sub.status = "past_due";
    sub.past_due_since = addDays(NOW, -4);
    sub.retry_count = 1;
    m.notes = "Card failed on the 1st — retry pending.";
  }

  // Persona: an expired token that slipped through (all five states present).
  {
    const m = members[14];
    const issued = addDays(NOW, -65);
    const tok = mintToken(m.id, issued);
    tok.issued_at = issued;
    tok.expires_at = addDays(issued, 60);
    tok.state = "EXPIRED";
    logEvent(tok.id, "expired", "system", tok.expires_at);
  }

  // Demand fill for the staged-opening demo. The week fills backwards from
  // Friday, each day gating the previous at 85%. Seed Friday ~90% (so Thursday
  // opens) and Thursday ~55% (so Wednesday stays "Unavailable"). Wed/Tue/Mon
  // read as taken, except any last-minute slots within 3 days.
  {
    const nowMs = Date.parse(NOW);
    const releasedOn = (dow: number) =>
      slots
        .filter(
          (s) =>
            s.day_type === "weekday" &&
            Date.parse(s.starts_at) > nowMs &&
            Date.parse(s.release_at) <= nowMs &&
            new Date(s.starts_at).getUTCDay() === dow,
        )
        .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));

    const fillDay = (dow: number, targetPct: number, seedOffset: number) => {
      const daySlots = releasedOn(dow);
      const total = daySlots.length;
      const alreadyBooked = daySlots.filter((s) => s.booked).length;
      const target = Math.round(total * targetPct) - alreadyBooked;
      const free = daySlots.filter((s) => !s.booked);
      for (let i = 0; i < Math.max(0, target) && i < free.length; i++) {
        const s = free[i];
        const m = members[1 + ((i * 3 + seedOffset) % SEATS)];
        const tok = mintToken(m.id, addDays(NOW, -(2 + (i % 20))));
        tok.state = "RESERVED";
        tok.frozen_at = NOW;
        tok.booking_id = `bk_${++bookingSeq}`;
        logEvent(tok.id, "reserved", m.id, NOW);
        logEvent(tok.id, "frozen", "system", NOW);
        s.booked = true;
        bookings.push({
          id: tok.booking_id, member_id: m.id, token_id: tok.id, slot_id: s.id,
          kind: "member", status: "confirmed", price_paid: 0,
          created_via: i % 4 === 0 ? "chat" : "calendar", created_at: NOW, beard_addon: i % 5 === 0,
        });
      }
    };

    fillDay(5, 0.9, 7); // Friday ~90% → Thursday opens
    fillDay(4, 0.55, 13); // Thursday ~55% → Wednesday stays unavailable
  }

  // Waitlist: a couple waiting.
  waitlist.push(
    { id: "wl_1", contact: "Aaron Dyer", email: "aaron.d@example.com", availability_profile: ["weekday_day"], created_at: addDays(NOW, -12), notified_at: null },
    { id: "wl_2", contact: "Peter Beardsley", email: "pete.b@example.com", availability_profile: ["evening", "weekend"], created_at: addDays(NOW, -3), notified_at: null },
  );

  // Live chats — one primed with "you free Thursday?" to demo chat-to-book.
  {
    const m = members[12]; // night-shift worker
    const chatId = "chat_1";
    chats.push({
      id: chatId, member_id: m.id, created_at: addDays(NOW, -2),
      last_message_at: addDays(NOW, -0.1), unread_for_barber: true, unread_for_member: false,
    });
    messages.push(
      { id: "msg_1", chat_id: chatId, sender: m.id, body: "Alright mate — you free Thursday afternoon? Finishing a night shift so anytime after 1 works.", created_at: addDays(NOW, -0.1), offer_status: null },
    );
  }
  {
    const m = members[1];
    const chatId = "chat_2";
    chats.push({
      id: chatId, member_id: m.id, created_at: addDays(NOW, -6),
      last_message_at: addDays(NOW, -5.9), unread_for_barber: false, unread_for_member: false,
    });
    messages.push(
      { id: "msg_2", chat_id: chatId, sender: m.id, body: "Cheers for yesterday, sharp as owt.", created_at: addDays(NOW, -6), offer_status: null },
      { id: "msg_3", chat_id: chatId, sender: "barber", body: "Anytime marra. Same time in 4 weeks?", created_at: addDays(NOW, -5.9), offer_status: null },
    );
  }

  return {
    members,
    subscriptions,
    tokens,
    bookings,
    slots,
    gifts,
    chats,
    messages,
    token_events,
    waitlist,
    settings,
    clock: { now: NOW },
    session: { member_id: null, role: "member" },
    mail: [],
  };
}
