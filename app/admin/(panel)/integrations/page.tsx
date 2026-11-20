import { requireAdmin } from "@/lib/admin/auth";
import { disconnectIntegration } from "@/lib/admin/actions";
import { env, integrations } from "@/lib/env";
import { readToken } from "@/lib/server/tokens";
import { instagramRedirectUri } from "@/lib/integrations/instagram";
import { Badge, Card, PageHead, btn, btnGhost } from "@/components/admin/ui";

export default async function Integrations({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const { error, connected } = await searchParams;
  await requireAdmin();
  const [google, instagram] = await Promise.all([readToken("google").catch(() => null), readToken("instagram").catch(() => null)]);

  const rows = [
    { name: "Supabase", status: integrations.supabaseAdmin ? "live" : integrations.supabase ? "partial" : "missing", detail: integrations.supabaseAdmin ? "Database, auth and storage connected." : "Set SUPABASE_SERVICE_ROLE_KEY so public forms can be saved securely.", env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"] },
    { name: "Resend email", status: integrations.resend ? (env.adminEmail ? "live" : "partial") : "missing", detail: integrations.resend ? `Sending from ${env.resendFrom}${env.adminEmail ? `; notifications to ${env.adminEmail}` : "; set ADMIN_NOTIFICATION_EMAIL for team alerts"}.` : "Confirmation emails are skipped until configured. The sending domain must be verified in Resend.", env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "ADMIN_NOTIFICATION_EMAIL"] },
    { name: "Google Calendar & Meet", status: google ? "live" : integrations.google ? "partial" : "missing", detail: google ? `Connected as ${google.accountLabel ?? "Google account"}, calendar “${env.googleCalendarId}”. Bookings create events with Meet links.` : integrations.google ? "Credentials present. Connect the business Google account." : "Without it, bookings stay “requested” and you add Meet links manually.", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_CALENDAR_ID", "OAUTH_TOKEN_ENCRYPTION_KEY"], connect: integrations.google && !google ? "/api/admin/google/connect" : null, provider: google ? "google" : null, note: `Redirect URI: ${env.googleRedirectUri ?? `${env.siteUrl}/api/admin/google/callback`}` },
    { name: "Instagram (Meta Graph API)", status: instagram ? "live" : integrations.instagram ? "partial" : "missing", detail: instagram ? `Connected as ${instagram.accountLabel}. Comments flow into Reviews as pending.` : integrations.instagram ? "App credentials present. Connect the Instagram professional account." : "Reviews can still be added manually with their Instagram link.", env: ["META_APP_ID", "META_APP_SECRET", "INSTAGRAM_VERIFY_TOKEN", "OAUTH_TOKEN_ENCRYPTION_KEY"], connect: integrations.instagram && !instagram ? "/api/admin/instagram/connect" : null, provider: instagram ? "instagram" : null, note: `OAuth redirect: ${instagramRedirectUri()} · Webhook: ${env.siteUrl}/api/instagram/webhook (field: comments)` },
  ];

  return (
    <>
      <PageHead title="Integrations" />
      {error && <p role="alert" className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>}
      {connected && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Connected {connected}.</p>}
      <div className="grid gap-4">
        {rows.map((r) => (
          <Card key={r.name} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="flex items-center gap-2 font-semibold">{r.name} <Badge value={r.status} /></p>
              <p className="mt-1 text-sm text-neutral-600">{r.detail}</p>
              <p className="mt-2 font-mono text-xs text-neutral-500">{r.env.join(" · ")}</p>
              {r.note && <p className="mt-1 break-all font-mono text-xs text-neutral-500">{r.note}</p>}
            </div>
            <div className="flex gap-2">
              {r.connect && <a href={r.connect} className={btn}>Connect</a>}
              {r.provider && <form action={disconnectIntegration}><input type="hidden" name="provider" value={r.provider} /><button className={btnGhost}>Disconnect</button></form>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
