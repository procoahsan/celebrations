import "server-only";
import { env, integrations } from "@/lib/env";
import { readToken, saveToken } from "@/lib/server/tokens";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.freebusy", "openid", "email"];
interface GoogleToken { refresh_token: string; access_token?: string; expires_at?: number }

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.googleClientId!, redirect_uri: env.googleRedirectUri!, response_type: "code", scope: SCOPES.join(" "),
    access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.googleClientId!, client_secret: env.googleClientSecret!, redirect_uri: env.googleRedirectUri!, grant_type: "authorization_code" }),
  });
  const json = await res.json();
  if (!res.ok || !json.refresh_token) throw new Error(json.error_description ?? "Google did not return a refresh token");
  let label: string | undefined;
  try { label = JSON.parse(Buffer.from(String(json.id_token).split(".")[1], "base64url").toString()).email; } catch { /* optional */ }
  await saveToken("google", { refresh_token: json.refresh_token, access_token: json.access_token, expires_at: Date.now() + json.expires_in * 1000 } satisfies GoogleToken, label);
}

async function accessToken() {
  if (!integrations.google) return null;
  const token = await readToken<GoogleToken>("google");
  if (!token) return null;
  if (token.access_token && token.expires_at && token.expires_at > Date.now() + 60_000) return token.access_token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.googleClientId!, client_secret: env.googleClientSecret!, refresh_token: token.refresh_token, grant_type: "refresh_token" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description ?? "Google token refresh failed");
  await saveToken("google", { refresh_token: token.refresh_token, access_token: json.access_token, expires_at: Date.now() + json.expires_in * 1000 }, token.accountLabel ?? undefined);
  return json.access_token as string;
}

export async function googleConnected() {
  return Boolean(integrations.google && (await readToken("google")));
}

/** Busy intervals from the business calendar (used to hide taken consultation slots). */
export async function googleBusy(timeMin: Date, timeMax: Date): Promise<Array<{ start: Date; end: Date }>> {
  const token = await accessToken().catch(() => null);
  if (!token) return [];
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), items: [{ id: env.googleCalendarId }] }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.calendars?.[env.googleCalendarId]?.busy ?? []).map((b: { start: string; end: string }) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

/** Creates the consultation event with a genuine Google Meet conference and invites the client. */
export async function createConsultationEvent(input: { summary: string; description: string; start: Date; end: Date; attendee: { email: string; name: string }; requestId: string }) {
  const token = await accessToken();
  if (!token) return null;
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: env.timezone },
      end: { dateTime: input.end.toISOString(), timeZone: env.timezone },
      attendees: [{ email: input.attendee.email, displayName: input.attendee.name }],
      conferenceData: { createRequest: { requestId: input.requestId, conferenceSolutionKey: { type: "hangoutsMeet" } } },
      reminders: { useDefault: true },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Google Calendar event creation failed");
  const meet = json.hangoutLink ?? json.conferenceData?.entryPoints?.find((e: { entryPointType: string }) => e.entryPointType === "video")?.uri ?? null;
  return { eventId: json.id as string, meetUrl: meet as string | null, htmlLink: json.htmlLink as string };
}

export async function cancelConsultationEvent(eventId: string) {
  const token = await accessToken();
  if (!token) return;
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId)}/events/${eventId}?sendUpdates=all`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
