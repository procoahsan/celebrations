import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { createServiceClient } from "@/lib/supabase/service";
import { getAvailability, slotDuration } from "@/lib/server/availability";
import { createConsultationEvent } from "@/lib/integrations/google";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/server/email";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Books a consultation: re-checks live availability, inserts the booking (a DB exclusion constraint
 * prevents double booking), creates a Google Calendar event with a real Meet link when Google is
 * connected, and sends a Resend confirmation.
 */
export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "booking"), 5)) return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ status: "requested" });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "Online booking isn't connected yet. Please reach us through the contact page or Instagram." }, { status: 503 });

  const start = new Date(input.startsAt);
  const availability = await getAvailability(90);
  if (!availability.days.some((d) => d.slots.includes(start.toISOString()))) {
    return NextResponse.json({ error: "That time was just taken or is no longer available. Please choose another." }, { status: 409 });
  }
  const end = new Date(start.getTime() + (await slotDuration(start)) * 60_000);

  const { data: booking, error } = await db.from("consultation_bookings").insert({
    customer_name: input.name, customer_email: input.email, customer_phone: input.phone || null,
    starts_at: start.toISOString(), ends_at: end.toISOString(), timezone: env.timezone, status: "requested", topic: input.topic || null, notes: input.notes || null,
  }).select("id").single();
  if (error) {
    const conflict = error.code === "23P01";
    return NextResponse.json({ error: conflict ? "That time was just taken. Please choose another." : "We couldn't save your booking. Please try again." }, { status: conflict ? 409 : 500 });
  }

  let meetUrl: string | null = null;
  let confirmed = false;
  try {
    const event = await createConsultationEvent({
      summary: `The Celebrations consultation · ${input.name}`,
      description: `Creative consultation with The Celebrations.\n\nTopic: ${input.topic || "-"}\nNotes: ${input.notes || "-"}\nPhone: ${input.phone || "-"}`,
      start, end, attendee: { email: input.email, name: input.name }, requestId: booking.id,
    });
    if (event) {
      meetUrl = event.meetUrl;
      confirmed = true;
      await db.from("consultation_bookings").update({ status: "confirmed", google_event_id: event.eventId, meet_url: event.meetUrl }).eq("id", booking.id);
    }
  } catch (e) {
    console.error("[bookings] calendar", e); // booking stays "requested" for manual confirmation
  }

  const when = new Intl.DateTimeFormat("en-GB", { timeZone: env.timezone, dateStyle: "full", timeStyle: "short" }).format(start);
  await Promise.all([
    sendEmail({
      to: input.email,
      subject: confirmed ? `Your consultation is confirmed · ${when}` : `We've received your consultation request · ${when}`,
      html: emailLayout(confirmed ? "Your consultation is confirmed." : "Your request has arrived.", `<p>Dear ${escapeHtml(input.name)},</p><p>${confirmed ? "We look forward to meeting you" : "We have received your request for"} <strong>${when}</strong> (${env.timezone}).</p>${meetUrl ? `<p>Join on Google Meet: <a href="${meetUrl}">${meetUrl}</a><br/>A calendar invitation has also been sent to you.</p>` : `<p>We'll confirm the time and send your meeting link shortly.</p>`}<p>If you'd like to prepare, you can start a concept in our <a href="${env.siteUrl}/design-your-event">Event Studio</a>.</p>`),
    }),
    env.adminEmail ? sendEmail({ to: env.adminEmail, replyTo: input.email, subject: `Consultation ${confirmed ? "booked" : "requested"} · ${input.name} · ${when}`, html: emailLayout("New consultation", `<p>${escapeHtml(input.name)} · ${escapeHtml(input.email)} · ${escapeHtml(input.phone ?? "")}</p><p>${when}</p><p>${escapeHtml(input.topic)}</p><p>${escapeHtml(input.notes)}</p><p><a href="${env.siteUrl}/admin/bookings">Open bookings →</a></p>`) }) : Promise.resolve(),
  ]);

  return NextResponse.json({ status: confirmed ? "confirmed" : "requested", meetUrl, when });
}
