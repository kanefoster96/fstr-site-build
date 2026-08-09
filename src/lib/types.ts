/**
 * FSTR Cuts data model — the contract for Supabase later.
 * Money is stored in pence (int). Times are ISO-8601 strings so the mock
 * clock and future Postgres both round-trip cleanly.
 */

export type ISODate = string; // ISO-8601, e.g. "2026-08-09T11:00:00.000Z"
export type Pence = number; // integer pence

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export type MemberStatus = "active" | "paused" | "cancelled" | "waitlist";
export type AvailabilityFlag = "weekday_day" | "evening" | "weekend";

export type SubscriptionTier = "monthly"; // room left for "fortnightly" later (§13)
export type SubscriptionStatus = "active" | "past_due" | "paused" | "cancelled";

/** The five token states. No others. (§3 state machine) */
export type TokenState =
  | "ISSUED"
  | "RESERVED"
  | "REDEEMED"
  | "GIFTED"
  | "EXPIRED";

export type TokenSource = "subscription" | "referral_reward" | "goodwill" | "one_off";

export type BookingKind =
  | "member"
  | "one_off"
  | "weekend_upgrade"
  | "weekend_oneoff"
  | "prebook_pending";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type CreatedVia = "calendar" | "chat" | "prebook";

export type DayType = "weekday" | "weekend";

export type Role = "member" | "barber";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  availability_profile: AvailabilityFlag[];
  joined_at: ISODate;
  seat_number: number | null; // null while on waitlist
  status: MemberStatus;
  role: Role;
  // Preferences / personalisation
  usual_cut?: string;
  notes?: string; // barber-facing notes
  cut_frequency_weeks?: number; // how often they like a cut (from onboarding)
  // Trial → membership: extra paid on a one-off, credited to the first token if
  // they join on the day (§ onboarding). Cosmetic in the mock (payments faked).
  trial_credit?: Pence;
  trial_credit_expires?: ISODate | null;
  // Gamification
  streak_months?: number;
  badges?: string[];
  pending_bonus?: number; // bonus tokens queued while the wallet was full
}

export interface Subscription {
  id: string;
  member_id: string;
  tier: SubscriptionTier;
  price_locked: Pence; // the locked price per token (per billing cycle)
  billing_day: number; // day-of-month (legacy display only)
  // Variable cadence: a token mints every `cycle_weeks` weeks. Members can
  // change plan once per billing cycle (2/3/4/5/6 weeks).
  cycle_weeks: number; // 2..6, default 4
  last_billing_at: ISODate | null;
  next_billing_at: ISODate;
  plan_locked_until_next_billing: boolean; // one change per cycle
  status: SubscriptionStatus;
  started_at: ISODate;
  cancel_effective_at: ISODate | null;
  reclaim_deadline: ISODate | null; // 30-day "reclaim your rate" window
  // Payment-failure timeline state (§7)
  past_due_since?: ISODate | null;
  retry_count?: number;
}

export interface Token {
  id: string;
  member_id: string;
  state: TokenState;
  issued_at: ISODate;
  expires_at: ISODate; // issued_at + 60 days
  frozen_at: ISODate | null; // set when RESERVED — clock stops
  booking_id: string | null;
  gift_id: string | null;
  source: TokenSource;
}

export interface Booking {
  id: string;
  member_id: string | null; // nullable for one-offs
  token_id: string | null; // nullable for one-offs / weekend publics
  combined_token_id?: string | null; // second silver coin when two are paired for a cut
  slot_id: string;
  kind: BookingKind;
  status: BookingStatus;
  price_paid: Pence;
  created_via: CreatedVia;
  created_at: ISODate;
  beard_addon?: boolean;
  // one-off contact (no member record)
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  // audit for late cancels / no-shows
  reason?: string;
  photo_url?: string | null;
}

export interface Slot {
  id: string;
  starts_at: ISODate;
  duration_mins: number; // 45 default, 60 for beard add-on
  day_type: DayType;
  published: boolean;
  release_at: ISODate;
  member_only_until: ISODate | null; // members get first look / early access
  capacity: 1;
  booked?: boolean;
}

export type GiftStatus = "sent" | "opened" | "booked" | "returned" | "expired";

export interface Gift {
  id: string;
  token_id: string;
  code: string;
  from_member_id: string;
  to_contact: string; // name or contact of recipient
  created_at: ISODate;
  expires_at: ISODate; // created_at + 14 days
  redeemed_at: ISODate | null;
  returned_at: ISODate | null;
  opened_at?: ISODate | null;
  status: GiftStatus;
  converted?: boolean; // recipient became a member → gifter rewarded (referral)
}

export interface SlotSuggestion {
  slot_id: string;
  starts_at: ISODate;
  duration_mins: number;
  price: Pence;
  requires_token: boolean;
}

export interface Message {
  id: string;
  chat_id: string;
  sender: string; // member_id or "barber"
  body: string;
  created_at: ISODate;
  slot_suggestion?: SlotSuggestion | null;
  // when a suggestion is acted on
  offer_status?: "pending" | "accepted" | "declined" | null;
  booking_id?: string | null;
}

export interface Chat {
  id: string;
  member_id: string;
  created_at: ISODate;
  last_message_at: ISODate;
  unread_for_barber?: boolean;
  unread_for_member?: boolean;
}

export type TokenEventType =
  | "issued"
  | "reserved"
  | "redeemed"
  | "gifted"
  | "gift_returned"
  | "cancelled"
  | "expired"
  | "frozen"
  | "unfrozen"
  | "reinstated"
  | "billing_paused_wallet_full";

export interface TokenEvent {
  id: string;
  token_id: string;
  event: TokenEventType;
  actor: string; // member_id, "barber", or "system"
  timestamp: ISODate;
  metadata?: Record<string, unknown>;
}

export interface WaitlistEntry {
  id: string;
  contact: string;
  email?: string;
  availability_profile: AvailabilityFlag[];
  created_at: ISODate;
  notified_at: ISODate | null;
  claim_deadline?: ISODate | null;
}

export interface PricingBand {
  from_seat: number;
  to_seat: number;
  price: Pence;
  label: string;
  note?: string;
}

/** Per-cadence pricing: the shorter the gap between cuts, the lower the price
 *  per cut. One cut per billing cycle, beard tidy included. */
export interface PlanPrice {
  weeks: number;
  price: Pence;
}

export interface Settings {
  // pricing ladder (§6)
  pricing_ladder: PricingBand[];
  // Price per cadence (§6, revised). The price a member pays each cycle is set
  // by how often they get a cut, not by seat. `current_rate` is the 4-week
  // default / reference; the marketing "from" price is the cheapest plan.
  plan_prices: PlanPrice[];
  current_rate: Pence; // reference rate (4-week default)
  waitlist_price: Pence;
  // caps
  total_seats: number; // 130
  weekday_daily_cap: number;
  weekend_slots_max: number; // 4
  // schedule
  weekend_day: "saturday" | "sunday"; // §13 toggle, default saturday
  open_days: number[]; // 0=Sun..6=Sat — days the barber actually works
  day_start: string; // "09:30" — first slot start
  day_end: string; // "14:30" — chair closes (last slot ends by here)
  slot_length_mins: number; // 45
  slot_buffer_mins: number; // 15 end buffer → slots sit on the hour
  // Staged, demand-driven opening. The week fills backwards from Friday:
  // fill_order lists weekdays latest→earliest. The first (Friday) is the
  // anchor and always shows. Each earlier day appears only once the day after
  // it is >= reveal_threshold booked. Hidden days read as "Unavailable".
  fill_order: number[]; // [5,4,3,2,1] Fri→Mon
  reveal_threshold: number; // 0.85 — per-day gate
  // Hidden days still open up close-in, so last-minute bookers can grab them.
  last_minute_days: number; // 3 — slots within this window are always bookable
  // Membership plans: a token mints every N weeks. Members can change once per
  // billing cycle. Same locked price per token; cadence sets frequency.
  plans: number[]; // [2,3,4,5,6] weeks
  default_cycle_weeks: number; // 4
  // rule numbers (all admin-editable, defaults as specced §13)
  rules: {
    token_life_days: number; // fallback life for tokens with no billing cycle
    token_cycles_life: number; // 2 — a token lasts this many billing cycles
    max_held: number; // 5 total (2 active + up to 3 stored)
    active_display: number; // 2 — shown prominently as "active"
    store_cap: number; // 3 — additional "stored" tokens allowed
    plan_prompt_threshold: number; // 5 — nudge to slow cadence at/above this held
    gift_life_days: number; // 14
    cancel_cutoff_hours: number; // 24
    cancel_extend_days: number; // 7
    member_release_weeks: number; // 2
    oneoff_window_days: number; // 7
    weekend_early_access_hours: number; // 48
    reclaim_window_days: number; // 30
    retry_days: number[]; // [3,5,7]
    pause_membership_day: number; // 10
    liability_amber: number; // 40
    liability_red: number; // 60
    wait_to_book_flag_days: number; // 10
  };
  // feature flags (§13)
  flags: {
    pause_holding_fee: boolean; // £5/mo variant, default OFF
    trial_offer: boolean; // £35-first-cut refund, default OFF
    three_day_opening: boolean; // default OFF (all weekdays capped)
  };
  weekend_upgrade_surcharge: Pence; // +£10 token upgrade
  weekend_public_price: Pence; // £35
  oneoff_price: Pence; // £35
  beard_addon_price: Pence; // £8
  pause_holding_fee: Pence; // £5
}

/** The whole persisted store shape. */
export interface DataStore {
  members: Member[];
  subscriptions: Subscription[];
  tokens: Token[];
  bookings: Booking[];
  slots: Slot[];
  gifts: Gift[];
  chats: Chat[];
  messages: Message[];
  token_events: TokenEvent[];
  waitlist: WaitlistEntry[];
  settings: Settings;
  // mock infra state
  clock: { now: ISODate };
  session: { member_id: string | null; role: Role };
  mail: MailItem[];
}

export interface MailItem {
  id: string;
  template: string;
  to: string;
  subject: string;
  preview: string; // short text
  html: string; // rendered template
  sent_at: ISODate;
  meta?: Record<string, unknown>;
}
