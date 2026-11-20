"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import MonthCalendar from "./MonthCalendar";

interface Availability { timezone: string; rulesConfigured: boolean; calendarLive: boolean; bookingEnabled: boolean; slotMinutes: number; days: { date: string; weekday: number; slots: string[] }[] }
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done"; status: string; meetUrl: string | null; when: string } | { kind: "error"; message: string; fields?: Record<string, string[]> };

export default function BookingExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Availability | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const load = () => fetch("/api/availability?days=90").then((r) => r.json()).then((json: Availability) => {
    setData(json);
    setDay((d) => d ?? json.days.find((x) => x.slots.length)?.date ?? null);
  }).catch(() => setLoadError(true));
  useEffect(() => { load(); }, []);

  const fmt = useMemo(() => data && {
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }),
    month: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }),
    time: new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: data.timezone }),
    full: new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" }),
  }, [data]);

  const current = data?.days.find((d) => d.date === day);

  useGSAP(() => {
    gsap.from("[data-slot]", { autoAlpha: 0, y: 12, stagger: 0.03, duration: 0.6 });
  }, { scope: root, dependencies: [day] });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slot) return;
    setStatus({ kind: "sending" });
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startsAt: slot }) }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) { setStatus({ kind: "error", message: json?.error ?? "Network error. Please try again.", fields: json?.fields }); if (res?.status === 409) { setSlot(null); load(); } return; }
    setStatus({ kind: "done", status: json.status, meetUrl: json.meetUrl, when: json.when });
  };
  const err = (n: string) => (status.kind === "error" && status.fields?.[n]?.[0]) || null;

  return (
    <div ref={root} className="grid gap-[6vw] bg-ivory px-[var(--gutter)] pb-[14vh] text-nocturne lg:grid-cols-[1.15fr_0.85fr]">
      <section aria-labelledby="pick-heading" className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-nocturne/15 pb-4">
          <h2 id="pick-heading" className="display text-4xl">Choose a time</h2>
          {data && <p className="label text-nocturne/60">Times in {data.timezone.replace("_", " ")} · {data.slotMinutes} min · video call</p>}
        </div>
        {data && !data.calendarLive && <p className="mt-4 text-sm text-nocturne/60">Showing our studio hours. Your request is confirmed by our team{data.bookingEnabled ? "" : " once online booking is connected"}.</p>}
        {loadError && <p role="alert" className="mt-6">Availability couldn&apos;t load. Please refresh or use the contact page.</p>}
        {!data && !loadError && <p className="label mt-8 opacity-60">Loading availability…</p>}

        {data && (
          <>
            <MonthCalendar days={data.days} selected={day} onSelect={(d) => { setDay(d); setSlot(null); }} />
            <div className="mt-10 border-t border-nocturne/15 pt-6" aria-live="polite">
              {!current && <p className="opacity-60">Pick a highlighted date to see its times.</p>}
              {current && <p className="label mb-4">{fmt?.full.format(new Date(`${current.date}T12:00:00Z`))}</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="listbox" aria-label="Times">
                {current?.slots.map((s) => (
                  <button key={s} data-slot type="button" role="option" aria-selected={slot === s} onClick={() => setSlot(s)}
                    className={`border py-3 text-sm transition-colors ${slot === s ? "border-rouge bg-rouge text-ivory" : "border-nocturne/15 hover:border-nocturne"}`}>
                    {fmt?.time.format(new Date(s))}
                  </button>
                ))}
                {current && !current.slots.length && <p className="col-span-full opacity-60">No times left on this day.</p>}
              </div>
            </div>
          </>
        )}
      </section>

      <aside className="h-max bg-nocturne p-8 text-ivory lg:sticky lg:top-[calc(var(--nav-h)+1rem)]" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="display text-4xl">Your consultation</h2>
        <dl className="mt-6 divide-y divide-ivory/15 border-y border-ivory/15">
          <div className="flex justify-between py-3"><dt className="label text-mist">Format</dt><dd>Google Meet video call</dd></div>
          <div className="flex justify-between py-3"><dt className="label text-mist">When</dt><dd>{slot && data ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: data.timezone }).format(new Date(slot)) : "Choose a time"}</dd></div>
        </dl>

        {status.kind === "done" ? (
          <div className="mt-8 grid gap-4" role="status">
            <p className="display text-3xl italic">{status.status === "confirmed" ? "You're booked." : "Request received."}</p>
            <p className="text-ivory/80">{status.when}. {status.status === "confirmed" ? "A calendar invitation and confirmation email are on their way." : "We'll confirm by email with your meeting link."}</p>
            {status.meetUrl && <a href={status.meetUrl} target="_blank" rel="noreferrer" className="btn-portal w-max">Open Google Meet ↗</a>}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-5" noValidate>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <label className="field"><span>Name</span><input name="name" required autoComplete="name" />{err("name") && <em className="text-sm not-italic text-[#f0a3ab]">{err("name")}</em>}</label>
            <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" />{err("email") && <em className="text-sm not-italic text-[#f0a3ab]">{err("email")}</em>}</label>
            <label className="field"><span>Phone (optional)</span><input name="phone" type="tel" autoComplete="tel" /></label>
            <label className="field"><span>What are you celebrating?</span><input name="topic" placeholder="Nikkah, mehndi, birthday…" /></label>
            <label className="field"><span>Anything we should know</span><textarea name="notes" rows={3} /></label>
            {status.kind === "error" && <p role="alert" className="border-l-2 border-rouge bg-rouge/15 px-4 py-3 text-sm">{status.message}</p>}
            <button type="submit" disabled={!slot || status.kind === "sending"} className="btn-portal solid w-max disabled:cursor-not-allowed disabled:opacity-40"><span className="dot" />{status.kind === "sending" ? "Booking…" : slot ? "Book this time" : "Choose a time first"}</button>
          </form>
        )}
      </aside>
    </div>
  );
}
