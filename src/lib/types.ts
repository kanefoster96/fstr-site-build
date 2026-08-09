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

export type TokenSource = "subscription" | "referral_reward" | "goodwill";

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
  // Gamification
  streak_months?: number;
  badges?: string[];
}

export interface Subscription {
  id: string;
  member_id: string;
  tier: SubscriptionTier;
  price_locked: Pence; // the rate this member is locked at
  billing_day: number; // day-of-month 1..28
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

export interface Settings {
  // pricing ladder (§6)
  pricing_ladder: PricingBand[];
  current_rate: Pence; // rate a brand-new joiner pays now
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
  // staged, demand-driven opening: reveal the next weekday once the open set
  // crosses the threshold booked. base_open_days are always visible.
  base_open_days: number[]; // [3,4,5] Wed–Fri
  reveal_order: number[]; // [2,1] Tuesday then Monday
  reveal_threshold: number; // 0.85
  // rule numbers (all admin-editable, defaults as specced §13)
  rules: {
    token_life_days: number; // 60
    max_held: number; // 2
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
