import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { issueState } from "@/lib/admin/oauth-state";
import { integrations } from "@/lib/env";
import { instagramAuthUrl } from "@/lib/integrations/instagram";

export async function GET(request: Request) {
  await requireAdmin();
  if (!integrations.instagram) return NextResponse.redirect(new URL("/admin/integrations?error=instagram-env", request.url));
  return NextResponse.redirect(instagramAuthUrl(await issueState("instagram")));
}
