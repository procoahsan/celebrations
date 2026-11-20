import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { checkState } from "@/lib/admin/oauth-state";
import { exchangeInstagramCode } from "@/lib/integrations/instagram";

export async function GET(request: Request) {
  await requireAdmin();
  const p = new URL(request.url).searchParams;
  if (!(await checkState("instagram", p.get("state"))) || !p.get("code")) return NextResponse.redirect(new URL("/admin/integrations?error=instagram-state", request.url));
  try {
    await exchangeInstagramCode(p.get("code")!);
    return NextResponse.redirect(new URL("/admin/integrations?connected=instagram", request.url));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection failed";
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(message)}`, request.url));
  }
}
