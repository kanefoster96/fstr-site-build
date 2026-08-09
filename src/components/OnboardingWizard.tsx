"use client";

import { useState, useTransition } from "react";
import Coin from "./Coin";
import { gbp } from "@/lib/format";
import { completeMembership, completeOneOff, completeSkip, type OnboardData } from "@/app/join/actions";

type SlotOption = { id: string; day: string; time: string };

const FREQS = [
  { label: "Every 2 weeks", weeks: 2, sub: "Tight & sharp" },
  { label: "Every 3 weeks", weeks: 3, sub: "" },
  { label: "Every 4 weeks", weeks: 4, sub: "Most common" },
  { label: "Every 6 weeks", weeks: 6, sub: "Low-key" },
];

export default function OnboardingWizard({
  slots,
  rate,
  oneOffPrice,
  plans,
  foundingLeft,
}: {
  slots: SlotOption[];
  rate: number;
  oneOffPrice: number;
  plans: number[];
  foundingLeft: number;
}) {
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number>(4);
  const [planWeeks, setPlanWeeks] = useState<number>(4);
  const [usualCut, setUsualCut] = useState("");
  const [slotId, setSlotId] = useState<string | null>(null);

  const STEPS = ["Account", "About you", "Your plan", "First cut", "Ready"];
  const canNext = step === 0 ? name.trim() && email.trim() : true;
  const data: OnboardData = {
    name: name.trim(),
    email: email.trim(),
    avatarUrl: avatar,
    frequencyWeeks: frequency,
    planWeeks,
    usualCut: usualCut.trim(),
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
        {/* Step 0 — account / login */}
        {step === 0 && (
          <Step title="Let's get you sorted" blurb="Two seconds — this sets up your login.">
            <Field label="Your name" value={name} onChange={setName} placeholder="Danny Robson" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="danny@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Choose a password" />
            <p className="num text-[11px] text-steel">Mock login — no real account is created.</p>
          </Step>
        )}

        {/* Step 1 — about you */}
        {step === 1 && (
          <Step title="A bit about you" blurb="So the chair knows your usual before you sit down.">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-mist">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="You" className="h-full w-full object-cover" />
                ) : (
                  <span className="num text-lg text-steel">{name.slice(0, 1).toUpperCase() || "?"}</span>
                )}
              </div>
              <label className="cursor-pointer rounded-full border border-steel/50 px-4 py-2 text-sm hover:border-ink">
                Add a photo
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            </div>

            <div>
              <p className="text-sm font-medium">How often do you get a cut?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {FREQS.map((f) => (
                  <button
                    key={f.weeks}
                    type="button"
                    onClick={() => {
                      setFrequency(f.weeks);
                      setPlanWeeks(f.weeks);
                    }}
                    className={`rounded-xl border p-3 text-left ${
                      frequency === f.weeks ? "border-brass bg-mist" : "border-steel/30"
                    }`}
                  >
                    <span className="block text-sm font-medium">{f.label}</span>
                    {f.sub && <span className="num block text-[11px] text-steel">{f.sub}</span>}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Your usual (optional)" value={usualCut} onChange={setUsualCut} placeholder="Skin fade, scissor top" />
          </Step>
        )}

        {/* Step 2 — plan */}
        {step === 2 && (
          <Step title="Your plan" blurb="A token drops every cycle. Every plan's the same price — pick the pace that fits.">
            <div className="flex items-center gap-3 rounded-2xl bg-mist p-4">
              <Coin size={48} />
              <div>
                <p className="num text-2xl font-semibold value">{gbp(rate)}</p>
                <p className="num text-xs text-steel">per token · every plan</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">A token every…</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {plans.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setPlanWeeks(w)}
                    className={`num rounded-full px-4 py-2 text-sm ${
                      planWeeks === w ? "bg-brass text-ink" : "border border-steel/50 hover:border-ink"
                    }`}
                  >
                    {w} wks
                    {w === frequency && planWeeks !== w ? "" : ""}
                  </button>
                ))}
              </div>
              <p className="num mt-2 text-[11px] text-steel">
                Recommended from your answer: <span className="value">{frequency} weeks</span>. Change it anytime,
                once per cycle.
              </p>
            </div>
          </Step>
        )}

        {/* Step 3 — first cut */}
        {step === 3 && (
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

        {/* Step 4 — choose path */}
        {step === 4 && (
          <Step title={`All set, ${name.split(" ")[0] || "you"}`} blurb="Choose how you want to start.">
            <div className="rounded-xl bg-mist p-3 text-sm">
              <p className="num text-steel">
                {selectedSlot ? `First cut: ${selectedSlot.day} ${selectedSlot.time}` : "First cut: pick later"}
                {" · "}token every {planWeeks} wks
              </p>
            </div>

            {/* Membership */}
            <button
              type="button"
              disabled={pending}
              onClick={() => go(completeMembership)}
              className="w-full rounded-2xl bg-brass p-4 text-left text-ink disabled:opacity-60"
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">Start membership</span>
                <span className="num">{gbp(rate)}/cycle</span>
              </span>
              <span className="mt-0.5 block text-sm text-paper/80">
                Your first token now, and {selectedSlot ? "your cut booked in" : "book whenever suits"}.
              </span>
            </button>

            {/* One-off */}
            <button
              type="button"
              disabled={pending}
              onClick={() => go(completeOneOff)}
              className="w-full rounded-2xl border border-steel/40 p-4 text-left hover:border-ink disabled:opacity-60"
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">Just try a cut</span>
                <span className="num">{gbp(oneOffPrice)}</span>
              </span>
              <span className="mt-0.5 block text-sm text-steel">
                One-off, no commitment. Like it and join on the day — we knock{" "}
                {gbp(oneOffPrice - rate)} off your first token.
              </span>
            </button>

            {/* Skip */}
            <button
              type="button"
              disabled={pending}
              onClick={() => go(completeSkip)}
              className="num w-full py-2 text-sm text-steel hover:text-ink disabled:opacity-60"
            >
              Skip for now — take me to my dashboard
            </button>

            <p className="num text-center text-[11px] text-steel">
              Mock checkout · no card charged · {foundingLeft} Founding seats left
            </p>
          </Step>
        )}

        {/* Nav */}
        {step < 4 && (
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
