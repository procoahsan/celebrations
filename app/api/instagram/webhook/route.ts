import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleCommentWebhook, verifySignature } from "@/lib/integrations/instagram";

/** Meta webhook verification handshake. */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && env.instagramVerifyToken && p.get("hub.verify_token") === env.instagramVerifyToken) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/** Signed comment notifications → pending testimonials for moderation. */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) return new NextResponse("Invalid signature", { status: 401 });
  try { await handleCommentWebhook(JSON.parse(raw)); } catch (e) { console.error("[instagram webhook]", e); }
  return NextResponse.json({ received: true });
}
