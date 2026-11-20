import { NextResponse } from "next/server";
import { designSubmissionSchema } from "@/lib/validation";
import { createServiceClient } from "@/lib/supabase/service";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/server/email";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const decode = (dataUrl: string) => {
  const [meta, b64] = dataUrl.split(",");
  const type = /data:(image\/[a-z+]+);/.exec(meta)?.[1] ?? "image/jpeg";
  return { type, bytes: Buffer.from(b64, "base64"), ext: type.split("/")[1].replace("jpeg", "jpg") };
};

/** Persists an Event Studio concept: validated fields + full configuration JSON + preview/reference images in Storage. */
export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "design"), 5)) return NextResponse.json({ error: "Too many submissions. Please wait a few minutes." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = designSubmissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ reference: "RECEIVED" }); // honeypot

  const db = createServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Online submissions aren't connected yet. Please use “Export image” and share it with us on Instagram or via the contact page." }, { status: 503 });
  }

  const folder = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
  const upload = async (name: string, dataUrl: string) => {
    const file = decode(dataUrl);
    const path = `${folder}/${name}.${file.ext}`;
    const { error } = await db.storage.from("submissions").upload(path, file.bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return path;
  };

  try {
    const previewPath = await upload("board", input.previewImage);
    const preview3dPath = input.preview3dImage ? await upload("preview-3d", input.preview3dImage) : null;
    const referencePaths = await Promise.all(input.references.map((r, i) => upload(`reference-${i + 1}`, r.dataUrl)));
    const config = input.configuration as { eventType?: string };

    const { data, error } = await db.from("event_design_submissions").insert({
      customer_name: input.name,
      customer_email: input.email,
      customer_phone: input.phone,
      event_type: config.eventType || null,
      preferred_date: input.eventDate,
      venue: input.location,
      location: input.location,
      guest_count: input.guestCount,
      budget_range: input.budgetRange,
      concept: input.concept || null,
      special_requests: input.specialRequests || null,
      canvas_json: input.configuration,
      customizations: { ...(input.configuration as object), preview3dPath },
      preview_path: previewPath,
      reference_paths: referencePaths,
    }).select("id, reference_code").single();
    if (error) throw error;

    const preview = input.previewImage.split(",")[1];
    await Promise.all([
      sendEmail({
        to: input.email,
        subject: `We've received your concept · ${data.reference_code}`,
        html: emailLayout("Your concept has arrived.", `<p>Dear ${escapeHtml(input.name)},</p><p>Thank you for sending your celebration concept to The Celebrations. Our designers will review it and contact you to talk through details, availability and a quotation.</p><p style="font-family:monospace">Reference: ${data.reference_code}<br/>Event date: ${input.eventDate}<br/>Guests: ${input.guestCount}</p><p>Your moodboard is attached for your records. This concept is a starting point for our conversation, not a booking or quotation.</p>`),
        attachments: [{ filename: `concept-${data.reference_code}.jpg`, content: preview }],
      }),
      env.adminEmail ? sendEmail({
        to: env.adminEmail,
        replyTo: input.email,
        subject: `New studio concept · ${input.name} · ${input.eventDate}`,
        html: emailLayout("New Event Studio submission", `<p><strong>${escapeHtml(input.name)}</strong> · ${escapeHtml(input.email)} · ${escapeHtml(input.phone)}</p><p>${escapeHtml(config.eventType ?? "")} · ${input.guestCount} guests · ${escapeHtml(input.budgetRange)} · ${escapeHtml(input.location)}</p><p>${escapeHtml(input.concept)}</p><p><a href="${env.siteUrl}/admin/submissions/${data.id}">Open in admin →</a></p>`),
        attachments: [{ filename: "board.jpg", content: preview }],
      }) : Promise.resolve({ sent: false }),
    ]);

    return NextResponse.json({ reference: data.reference_code });
  } catch (e) {
    console.error("[design-submissions]", e);
    return NextResponse.json({ error: "We couldn't save your concept just now. Your design is still on this device; please try again shortly." }, { status: 500 });
  }
}
