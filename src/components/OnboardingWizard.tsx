"use client";

import { useState, useTransition } from "react";
import Coin from "@/components/Coin";
import TokenGuide from "@/components/TokenGuide";
import { gbp } from "@/lib/format";
import { completeMembership, completeOneOff, completeSkip, type OnboardData } from "@/app/join/actions";

type SlotOption = { id: string; day: string; time: string };
type PlanPrice = { weeks: number; price: number };

// Short tag per cadence — the price itself comes from planPrices.
const FREQ_SUBS: Record<number, string> = {
  2: "Tight & sharp",
  3: "",
  4: "Most common",
  5: "",
  6: "Low-key",
};

export default function OnboardingWizard({
  slots,
  rate,
  oneOffPrice,
  planPrices,
  foundingLeft,
}: {
  slots: SlotOption[];
  rate: number;
  oneOffPrice: number;
  planPrices: PlanPrice[];
  foundingLeft: number;
}) {
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number>(4);
  const [slotId, setSlotId] = useState<string | null>(null);

  // Final-step purchase flow: pick a plan, pay, earn a token, then spend it.
  const [plan, setPlan] = useState<"membership" | "oneoff" | null>(null);
  const [phase, setPhase] = useState<"choose" | "paying" | "paid">("choose");

  const STEPS = ["You", "How often", "First cut", "Ready"];
  const canNext = step === 0 ? !!(name.trim() && email.trim()) : true;
  const data: OnboardData = {
    name: name.trim(),
    email: email.trim(),
    avatarUrl: avatar,
    frequencyWeeks: frequency,
    planWeeks: frequency, // frequency sets the plan — and the price
    usualCut: "",
    slotId,
  };

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  const go = (fn: (d: OnboardData) => Promise<void>) => start(() => fn(data));
  const selectedSlot = slots.find((s) => s.id === slotId);
  const priceFor = (weeks: number) => planPrices.find((p) => p.weeks === weeks)?.price ?? rate;
  const membershipPrice = priceFor(frequency);
  const payAmount = plan === "oneoff" ? oneOffPrice : membershipPrice;

  // Simulate the checkout, then drop a token into the header wallet.
  function pay() {
    if (!plan) return;
    setPhase("paying");
    setTimeout(() => {
      window.dispatchEvent(new Event("fstr:token-earned"));
      setPhase("paid");
    }, 850);
  }

  // Spend the freshly-earned token to confirm the first cut, then finish set-up.
  function spendAndFinish() {
    if (selectedSlot) window.dispatchEvent(new Event("fstr:token-spent"));
    go(plan === "oneoff" ? completeOneOff : completeMembership);
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-brass" : "bg-mist"}`} />
            <p className={`num mt-1 text-[10px] ${i === step ? "value" : "text-steel"}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-steel/20 bg-paper p-6 sm:p-8">
        {/* Step 0 — your profile */}
        {step === 0 && (
          <Step title="Set up your profile" blurb="Two quick things — and a photo if you fancy.">
            <div className="flex flex-col items-center gap-3">
              <label className="relative cursor-pointer">
                <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-mist ring-2 ring-brass/30">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="You" className="h-full w-full object-cover" />
                  ) : (
                    <span className="num text-2xl text-steel">{name.slice(0, 1).toUpperCase() || "+"}</span>
                  )}
                </span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-paper">
                  {avatar ? "Change" : "Add photo"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
              <p className="num text-[11px] text-steel">Your barbering profile</p>
            </div>

            <Field label="Your name" value={name} onChange={setName} placeholder="Danny Robson" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="danny@example.com" />
            <p className="num text-[11px] text-steel">Mock sign-up — no real account is created.</p>
          </Step>
        )}

        {/* Step 1 — cut frequency (this also sets the price) */}
        {step === 1 && (
          <Step title="How often do you get a cut?" blurb="This sets your plan and your price — one cut per cycle, beard tidy included. Change it any time.">
            <div className="grid grid-cols-2 gap-2">
              {planPrices.map((p) => {
                const perWeek = p.price / p.weeks;
                const sub = FREQ_SUBS[p.weeks];
                return (
                  <button
                    key={p.weeks}
                    type="button"
                    onClick={() => setFrequency(p.weeks)}
                    className={`rounded-xl border p-4 text-left ${
                      frequency === p.weeks ? "border-brass bg-mist" : "border-steel/30"
                    }`}
                  >
                    <span className="block text-sm font-medium">Every {p.weeks} weeks</span>
                    <span className="num block text-[13px] value">{gbp(p.price)}</span>
                    <span className="num block text-[11px] text-steel">
                      {gbp(perWeek)}/wk{sub ? ` · ${sub}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="num text-[11px] text-steel">
              More often is cheaper per cut — <span className="value">{gbp(membershipPrice)}</span> for a cut
              every {frequency} weeks.
            </p>
          </Step>
        )}

        {/* Step 2 — first cut */}
        {step === 2 && (
          <Step title="Book your first cut" blurb="Pick a slot now, or sort it later from your dashboard.">
            {slots.length === 0 ? (
              <p className="text-sm text-steel">No slots open this second — you can book from your dashboard.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlotId(slotId === s.id ? null : s.id)}
                    className={`rounded-xl border p-3 text-center ${
                      slotId === s.id ? "border-brass bg-mist" : "border-steel/30"
                    }`}
                  >
                    <span className="num block text-xs text-steel">{s.day}</span>
                    <span className="num block text-sm">{s.time}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSlotId(null)}
              className={`num text-sm ${slotId === null ? "value" : "text-steel"}`}
            >
              I&apos;ll pick later →
            </button>
          </Step>
        )}

        {/* Step 3 — pay, earn a token, spend it */}
        {step === 3 && phase !== "paid" && (
          <Step title={`Almost there, ${name.split(" ")[0] || "you"}`} blurb="Choose how you'd like to pay — then your first token's yours.">
            <div className="rounded-xl bg-mist p-3 text-sm">
              <p className="num text-steel">
                {selectedSlot ? `First cut: ${selectedSlot.day} ${selectedSlot.time}` : "First cut: pick later"}
                {" · "}a token every {frequency} wks
              </p>
            </div>

            <button
              type="button"
              disabled={phase === "paying"}
              onClick={() => setPlan("membership")}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                plan === "membership" ? "border-brass bg-mist" : "border-steel/40 hover:border-ink"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">Membership</span>
                <span className="num">{gbp(membershipPrice)}/cycle</span>
              </span>
              <span className="mt-0.5 block text-sm text-steel">
                A token every {frequency} weeks — keep the chair, save on every cut.
              </span>
            </button>

            <button
              type="button"
              disabled={phase === "paying"}
              onClick={() => setPlan("oneoff")}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                plan === "oneoff" ? "border-brass bg-mist" : "border-steel/40 hover:border-ink"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">One-off cut</span>
                <span className="num">{gbp(oneOffPrice)}</span>
              </span>
              <span className="mt-0.5 block text-sm text-steel">
                A single token, no commitment. Join on the day and we knock{" "}
                {gbp(oneOffPrice - membershipPrice)} off your first membership token.
              </span>
            </button>

            <button
              type="button"
              disabled={!plan || phase === "paying"}
              onClick={pay}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brass py-3.5 text-sm font-semibold text-ink transition-opacity disabled:opacity-40"
            >
              {phase === "paying" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  Taking payment…
                </>
              ) : (
                <>Pay {gbp(payAmount)} &amp; get your token</>
              )}
            </button>

            <button
              type="button"
              disabled={pending || phase === "paying"}
              onClick={() => go(completeSkip)}
              className="num w-full py-1 text-sm text-steel hover:text-ink disabled:opacity-60"
            >
              Skip for now — take me to my dashboard
            </button>

            <p className="num text-center text-[11px] text-steel">
              A token is earned when you pay, and again on each billing date.{" "}
              <TokenGuide />
            </p>
            <p className="num text-center text-[11px] text-steel">
              Mock checkout · no card charged · {foundingLeft} Founding seats left
            </p>
          </Step>
        )}

        {/* Step 3 (paid) — the token landed; spend it to confirm the first cut */}
        {step === 3 && phase === "paid" && (
          <Step title="Nice — that's your first token" blurb="It just landed in your wallet (top-right). One token, one cut.">
            <div className="flex flex-col items-center gap-3 py-2">
              <Coin size={92} className="animate-coin-drop" />
              <p className="num text-[11px] text-steel">
                {gbp(payAmount)} paid · 1 token earned
              </p>
            </div>

            {selectedSlot ? (
              <>
                <div className="rounded-xl bg-mist p-3 text-center text-sm">
                  <p className="num text-steel">
                    Spend it on your first cut: <span className="value">{selectedSlot.day} {selectedSlot.time}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={spendAndFinish}
                  className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-50"
                >
                  {pending ? "Booking your cut…" : "Use my token — confirm this cut"}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={spendAndFinish}
                className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-50"
              >
                {pending ? "Setting up…" : "Take me to my wallet"}
              </button>
            )}

            <p className="num text-center text-[11px] text-steel">
              {selectedSlot
                ? "Spending a token books it instantly — nothing to pay at the chair."
                : "Your token's waiting in your wallet — book a slot whenever suits."}
            </p>
          </Step>
        )}

        {/* Nav */}
        {step < 3 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`num text-sm text-steel hover:text-ink ${step === 0 ? "invisible" : ""}`}
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-steel">{blurb}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass"
      />
    </label>
  );
}
