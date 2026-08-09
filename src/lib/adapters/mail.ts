import "server-only";
import type { DataStore, MailItem } from "../types";

/**
 * MailAdapter. Instead of sending, we log "sent" emails to a dev inbox
 * (/dev/mail) that renders the real templates. Swap this module for a real
 * transactional email provider later — callers just call sendMail().
 */

export interface MailTemplate {
  subject: string;
  preview: string;
  html: string;
}

let mailCounter = 0;

export function sendMail(
  db: DataStore,
  template: string,
  to: string,
  rendered: MailTemplate,
  meta?: Record<string, unknown>,
): MailItem {
  const item: MailItem = {
    id: `mail_${Date.now().toString(36)}_${++mailCounter}`,
    template,
    to,
    subject: rendered.subject,
    preview: rendered.preview,
    html: rendered.html,
    sent_at: db.clock.now,
    meta,
  };
  db.mail.unshift(item); // newest first
  return item;
}
