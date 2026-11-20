import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { createServiceClient } from "@/lib/supabase/service";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/server/email";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "contact"), 6)) return NextResponse.json({ error: "Too many messages. Please wait a few minutes." }, { status: 429 });
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "The contact inbox isn't connected yet. Please message us on Instagram for now." }, { status: 503 });
  const { error } = await db.from("contact_inquiries").insert({ name: input.name, email: input.email, phone: input.phone || null, event_type: input.eventType || null, message: input.message });
  if (error) return NextResponse.json({ error: "We couldn't send your message. Please try again." }, { status: 500 });

  await Promise.all([
    sendEmail({ to: input.email, subject: "Thank you for writing to The Celebrations", html: emailLayout("Thank you for reaching out.", `<p>Dear ${escapeHtml(input.name)},</p><p>We've received your message and will reply soon.</p><blockquote style="border-left:2px solid #c8a46a;padding-left:12px;color:#666">${escapeHtml(input.message)}</blockquote>`) }),
    env.adminEmail ? sendEmail({ to: env.adminEmail, replyTo: input.email, subject: `New inquiry · ${input.name}`, html: emailLayout("New contact inquiry", `<p>${escapeHtml(input.name)} · ${escapeHtml(input.email)} · ${escapeHtml(input.phone ?? "")}</p><p>${escapeHtml(input.eventType)}</p><p>${escapeHtml(input.message)}</p>`) }) : Promise.resolve(),
  ]);
  return NextResponse.json({ ok: true });
}
