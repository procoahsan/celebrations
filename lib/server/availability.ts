import "server-only";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { googleBusy, googleConnected } from "@/lib/integrations/google";

export interface Rule { weekday: number; start_time: string; end_time: string; slot_minutes: number }

/** Used only until the admin saves availability rules: Mon–Sat, 11:00–18:00, 45-minute consultations. */
export const DEFAULT_RULES: Rule[] = [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start_time: "11:00", end_time: "18:00", slot_minutes: 45 }));

/** Offset (ms) of a time zone at a given instant, via Intl (handles DST where applicable). */
function tzOffset(date: Date, timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

/** Wall-clock date + time in `timeZone` → UTC instant. */
export function zonedToUtc(date: string, time: string, timeZone = env.timezone) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return new Date(guess.getTime() - tzOffset(guess, timeZone));
}

export function zonedDateString(date: Date, timeZone = env.timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export interface DayAvailability { date: string; weekday: number; slots: string[] }

export async function getAvailability(days = 21) {
  const db = createServiceClient();
  let rules = DEFAULT_RULES;
  let configured = false;
  if (db) {
    const { data } = await db.from("availability_rules").select("weekday,start_time,end_time,slot_minutes");
    if (data?.length) { rules = data as Rule[]; configured = true; }
  }

  const now = new Date();
  const leadTime = new Date(now.getTime() + 18 * 3600_000); // minimum notice
  const rangeEnd = new Date(now.getTime() + (days + 1) * 86400_000);

  const busy: Array<{ start: Date; end: Date }> = [];
  if (db) {
    const [{ data: bookings }, { data: blackouts }] = await Promise.all([
      db.from("consultation_bookings").select("starts_at,ends_at").in("status", ["requested", "confirmed"]).gte("ends_at", now.toISOString()).lte("starts_at", rangeEnd.toISOString()),
      db.from("availability_blackouts").select("starts_at,ends_at").gte("ends_at", now.toISOString()).lte("starts_at", rangeEnd.toISOString()),
    ]);
    [...(bookings ?? []), ...(blackouts ?? [])].forEach((b) => busy.push({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));
  }
  const calendarLive = await googleConnected().catch(() => false);
  if (calendarLive) busy.push(...(await googleBusy(now, rangeEnd)));

  const result: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const date = zonedDateString(new Date(now.getTime() + i * 86400_000));
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const slots: string[] = [];
    for (const rule of rules.filter((r) => r.weekday === weekday)) {
      const start = zonedToUtc(date, rule.start_time.slice(0, 5));
      const end = zonedToUtc(date, rule.end_time.slice(0, 5));
      for (let t = start.getTime(); t + rule.slot_minutes * 60_000 <= end.getTime(); t += rule.slot_minutes * 60_000) {
        const s = new Date(t), e = new Date(t + rule.slot_minutes * 60_000);
        if (s < leadTime) continue;
        if (busy.some((b) => s < b.end && e > b.start)) continue;
        slots.push(s.toISOString());
      }
    }
    result.push({ date, weekday, slots });
  }
  return { timezone: env.timezone, rulesConfigured: configured, calendarLive, bookingEnabled: Boolean(db), days: result, slotMinutes: rules[0]?.slot_minutes ?? 45 };
}

export async function slotDuration(start: Date) {
  const db = createServiceClient();
  const weekday = new Date(`${zonedDateString(start)}T12:00:00Z`).getUTCDay();
  if (db) {
    const { data } = await db.from("availability_rules").select("weekday,start_time,end_time,slot_minutes").eq("weekday", weekday);
    if (data?.length) return (data[0] as Rule).slot_minutes;
  }
  return DEFAULT_RULES.find((r) => r.weekday === weekday)?.slot_minutes ?? 45;
}
