import type { MailTemplate } from "./adapters/mail";
import { gbp, fmtDateTime, fmtMonthDay } from "./format";
import type { Pence } from "./types";

/**
 * Email templates rendered by MailAdapter and viewable at /dev/mail.
 * Plain, confident, Geordie-warm. Numbers in mono. Brass only on value.
 */

function shell(title: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  return `
  <div style="font-family:'General Sans',system-ui,sans-serif;background:#FCFCFA;color:#111413;max-width:560px;margin:0 auto;padding:32px 28px;border:1px solid #efefea;border-radius:16px">
    <div style="font-family:'Clash Display',system-ui,sans-serif;font-weight:700;font-size:22px;letter-spacing:-0.02em">FSTR<span style="color:#A98C4B"> ·</span></div>
    <h1 style="font-family:'Clash Display',system-ui,sans-serif;font-size:26px;margin:20px 0 8px;line-height:1.05">${title}</h1>
    <div style="color:#3d4340;font-size:15px;line-height:1.55">${bodyHtml}</div>
    ${
      cta
        ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:#A98C4B;color:#FCFCFA;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${cta.label}</a>`
        : ""
    }
    <hr style="border:0;border-top:1px solid #e6e6e0;margin:26px 0 14px"/>
    <p style="color:#8B9196;font-size:12px;margin:0">FSTR Cuts · Wallsend area, North Tyneside · Exact address sent 24 hours before your cut.</p>
  </div>`;
}

const mono = (s: string) =>
  `<span style="font-family:'JetBrains Mono',ui-monospace,monospace">${s}</span>`;

export function welcomeEmail(name: string, seat: number, rate: Pence): MailTemplate {
  return {
    subject: "Welcome to FSTR — your seat is yours",
    preview: `Seat ${seat} locked at ${gbp(rate)} a cut.`,
    html: shell(
      `Welcome, ${name.split(" ")[0]}.`,
      `<p>You're in. Seat ${mono(String(seat))} is yours, locked at ${mono(gbp(rate))} a cut for as long as you stay subscribed.</p>
       <p>Your first token drops on your billing day — one cut, beard tidy included, two billing cycles to use it. It rolls over, and you can gift it to a mate. You never lose a cut you've paid for.</p>`,
      { label: "Open your wallet", href: "/me" },
    ),
  };
}

export function tokenMintedEmail(name: string, monthLabel: string, availableCount: number): MailTemplate {
  return {
    subject: `Your ${monthLabel} cut is ready`,
    preview: `One token, two cycles to use it. ${availableCount} slots open now.`,
    html: shell(
      `Your ${monthLabel} cut is ready`,
      `<p>A fresh token just landed in your wallet, ${name.split(" ")[0]}. ${mono(String(availableCount))} weekday slots are open right now.</p>
       <p>Book one, or just message the chair — whatever's easier.</p>`,
      { label: "Book your slot", href: "/me/book" },
    ),
  };
}

export function bookingConfirmedEmail(name: string, startsAt: string, beard: boolean): MailTemplate {
  return {
    subject: "Booked — see you soon",
    preview: fmtDateTime(startsAt),
    html: shell(
      "You're booked",
      `<p>${fmtDateTime(startsAt)} — ${mono(beard ? "60" : "45")} min${beard ? ", with a beard trim" : ""}. Your token's reserved and the clock's frozen until then.</p>
       <p>Address and parking notes land 24 hours before.</p>`,
    ),
  };
}

export function reminder24hEmail(name: string, startsAt: string, address: string): MailTemplate {
  return {
    subject: "Tomorrow's cut — address & parking",
    preview: `${fmtDateTime(startsAt)} · ${address}`,
    html: shell(
      "See you tomorrow",
      `<p>${fmtDateTime(startsAt)}.</p>
       <p><strong>${address}</strong><br/>Park on the street outside — the blue door, ring once. Give us a shout if you're running late.</p>`,
    ),
  };
}

export function giftSentEmail(fromName: string, toContact: string, code: string): MailTemplate {
  return {
    subject: "Your gift's on its way",
    preview: `Code ${code} sent to ${toContact}.`,
    html: shell(
      "Gift sent",
      `<p>Nice one, ${fromName.split(" ")[0]}. We've sent your cut to ${toContact}. They've got 14 days to book it.</p>
       <p>Their code: ${mono(code)}. If they don't use it, it comes straight back to you with whatever time was left on it.</p>`,
    ),
  };
}

export function giftReceivedEmail(fromName: string, code: string, expiresAt: string): MailTemplate {
  return {
    subject: `${fromName.split(" ")[0]} bought you a cut`,
    preview: `Redeem by ${fmtMonthDay(expiresAt)}.`,
    html: shell(
      `${fromName.split(" ")[0]} bought you a cut`,
      `<p>A proper cut at FSTR, on them. Beard tidy included.</p>
       <p>Your code: ${mono(code)} — book by ${mono(fmtMonthDay(expiresAt))}.</p>`,
      { label: "Claim your cut", href: `/gift/${code}` },
    ),
  };
}

export function nudgeEmail(name: string, dayMark: number, availableCount: number, expiresAt: string): MailTemplate {
  const heat = dayMark >= 50 ? "Don't let it slip" : dayMark >= 20 ? "Still time" : "Your cut's waiting";
  return {
    subject: `${heat} — your cut's ready to book`,
    preview: `${availableCount} slots open · use it by ${fmtMonthDay(expiresAt)}.`,
    html: shell(
      heat,
      `<p>Alright ${name.split(" ")[0]} — your token's been sat ${mono(String(dayMark))} days. There ${
        availableCount === 1 ? "is" : "are"
      } ${mono(String(availableCount))} slot${availableCount === 1 ? "" : "s"} open right now, and it's good until ${mono(fmtMonthDay(expiresAt))}.</p>
       <p>Two taps and it's booked — or just message the chair.</p>`,
      { label: "Book your cut", href: "/me/book" },
    ),
  };
}

export function streakMilestoneEmail(name: string, badge: string): MailTemplate {
  const perk =
    badge === "12 Months"
      ? "a free cut has landed in your wallet, and your priority booking continues"
      : "you've unlocked priority booking — you'll see new slots 24 hours early";
  return {
    subject: `${badge} with FSTR 🎉`,
    preview: perk,
    html: shell(
      `${badge}. Nice one.`,
      `<p>That's ${mono(badge.toLowerCase())} of sharp cuts, ${name.split(" ")[0]}. As a thank you, ${perk}.</p>`,
      { label: "Open your wallet", href: "/me" },
    ),
  };
}

export function reminder1hEmail(name: string, startsAt: string): MailTemplate {
  return {
    subject: "See you in an hour",
    preview: fmtDateTime(startsAt),
    html: shell("Nearly time", `<p>Your cut's at ${mono(fmtDateTime(startsAt).split("· ")[1] ?? "")}. Door's open — see you shortly.</p>`),
  };
}

export function paymentFailedEmail(name: string, retryDay: number, prebookAtRisk: boolean): MailTemplate {
  return {
    subject: "Payment didn't go through",
    preview: `We'll retry in ${retryDay} days.`,
    html: shell(
      "Quick one about your payment",
      `<p>Your card didn't go through this month. Nothing's lost yet — we'll try again in ${mono(String(retryDay))} days.</p>
       ${prebookAtRisk ? `<p><strong>Heads up:</strong> you've got a slot held. If the payment fails again you'll lose it.</p>` : ""}
       <p>Update your card whenever suits.</p>`,
      { label: "Update payment", href: "/me/profile" },
    ),
  };
}

export function waitlistSeatEmail(name: string, rate: Pence): MailTemplate {
  return {
    subject: "A seat's opened — 48 hours to claim",
    preview: `From ${gbp(rate)} a cut. First come, first served.`,
    html: shell(
      "A seat's opened up",
      `<p>You're next on the list. A seat's free — from ${mono(gbp(rate))} a cut, priced by how often you come — and it's yours if you claim it in the next ${mono("48")} hours.</p>`,
      { label: "Claim my seat", href: "/join" },
    ),
  };
}

export function oneOffFollowUpEmail(rate: Pence): MailTemplate {
  return {
    subject: "Enjoyed it? Here's the members' deal",
    preview: `Cuts from ${gbp(rate)} as a member.`,
    html: shell(
      "Fancy this regularly?",
      `<p>Hope the cut sorted you out. Membership starts at ${mono(gbp(rate))} a cut — priced by how often you come, rolls over, giftable, never wasted. And you'd get first look at every slot.</p>`,
      { label: "See membership", href: "/join" },
    ),
  };
}
