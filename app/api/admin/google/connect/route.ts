import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { issueState } from "@/lib/admin/oauth-state";
import { integrations } from "@/lib/env";
import { googleAuthUrl } from "@/lib/integrations/google";

export async function GET(request: Request) {
  await requireAdmin();
  if (!integrations.google) return NextResponse.redirect(new URL("/admin/integrations?error=google-env", request.url));
  return NextResponse.redirect(googleAuthUrl(await issueState("google")));
}
