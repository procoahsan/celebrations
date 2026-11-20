import "server-only";
import { Resend } from "resend";
import { env, integrations } from "@/lib/env";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Branded, minimal HTML email shell. */
export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f2ebe1;font-family:Georgia,serif;color:#0f0b0c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
  <tr><td style="padding:36px 40px 8px;font-size:22px;letter-spacing:-.02em"><em style="color:#c8a46a">The</em> Celebrations</td></tr>
  <tr><td style="padding:8px 40px 0;font-size:30px;line-height:1.1;font-style:italic">${escape(title)}</td></tr>
  <tr><td style="padding:20px 40px 40px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#3a3234">${body}</td></tr>
  </table></td></tr></table></body></html>`;
}

export { escape as escapeHtml };

export interface SendResult { sent: boolean; reason?: string }

export async function sendEmail(options: { to: string | string[]; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: string }[] }): Promise<SendResult> {
  if (!integrations.resend) return { sent: false, reason: "Resend is not configured" };
  try {
    const resend = new Resend(env.resendKey);
    const { error } = await resend.emails.send({ from: env.resendFrom!, to: options.to, subject: options.subject, html: options.html, replyTo: options.replyTo, attachments: options.attachments });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "Unknown email error" };
  }
}
