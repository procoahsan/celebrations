import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { checkState } from "@/lib/admin/oauth-state";
import { exchangeGoogleCode } from "@/lib/integrations/google";

export async function GET(request: Request) {
  await requireAdmin();
  const p = new URL(request.url).searchParams;
  if (!(await checkState("google", p.get("state"))) || !p.get("code")) return NextResponse.redirect(new URL("/admin/integrations?error=google-state", request.url));
  try {
    await exchangeGoogleCode(p.get("code")!);
    return NextResponse.redirect(new URL("/admin/integrations?connected=google", request.url));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection failed";
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(message)}`, request.url));
  }
}
