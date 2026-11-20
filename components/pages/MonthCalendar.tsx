"use client";
import { useMemo, useState, type KeyboardEvent } from "react";

interface Day { date: string; slots: string[] }

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const longLabel = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" });

/**
 * Full month calendar for consultation dates: every day of the month is shown, bookable days are
 * highlighted with their number of open times, and past / unavailable days are visibly disabled.
 * Arrow keys move between days (roving tabindex), Enter/Space selects.
 */
export default function MonthCalendar({ days, selected, onSelect }: { days: Day[]; selected: string | null; onSelect: (date: string) => void }) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const first = days[0]?.date ?? new Date().toISOString().slice(0, 10);
  const last = days[days.length - 1]?.date ?? first;
  const start = (selected ?? days.find((d) => d.slots.length)?.date ?? first).split("-").map(Number);
  const [view, setView] = useState({ y: start[0], m: start[1] - 1 });
  const [focus, setFocus] = useState<string | null>(null);

  const minMonth = first.slice(0, 7);
  const maxMonth = last.slice(0, 7);
  const viewKey = `${view.y}-${pad(view.m + 1)}`;
  const shift = (delta: number) => setView(({ y, m }) => { const d = new Date(Date.UTC(y, m + delta, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });

  const cells = useMemo(() => {
    const firstDow = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 6) % 7; // Monday-first
    const count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    return [...Array(firstDow).fill(null), ...Array.from({ length: count }, (_, i) => iso(view.y, view.m, i + 1))] as (string | null)[];
  }, [view]);

  const openCount = cells.filter((c) => c && (byDate.get(c)?.slots.length ?? 0) > 0).length;
  const active = focus && cells.includes(focus) ? focus : selected && cells.includes(selected) ? selected : cells.find((c) => c && byDate.get(c)?.slots.length) ?? cells.find(Boolean)!;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
    if (next.slice(0, 7) !== viewKey) { if (next.slice(0, 7) < minMonth || next.slice(0, 7) > maxMonth) return; shift(delta > 0 ? 1 : -1); }
    setFocus(next);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-cal="${next}"]`)?.focus());
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="display text-3xl" aria-live="polite">{monthLabel.format(new Date(Date.UTC(view.y, view.m, 1)))}</p>
        <div className="flex items-center gap-2">
          <span className="label mr-2 hidden text-nocturne/60 sm:inline">{openCount} open {openCount === 1 ? "day" : "days"}</span>
          <button type="button" onClick={() => shift(-1)} disabled={viewKey <= minMonth} aria-label="Previous month" className="grid h-11 w-11 place-items-center rounded-full border border-nocturne/20 transition-colors hover:bg-nocturne hover:text-ivory disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-nocturne">←</button>
          <button type="button" onClick={() => shift(1)} disabled={viewKey >= maxMonth} aria-label="Next month" className="grid h-11 w-11 place-items-center rounded-full border border-nocturne/20 transition-colors hover:bg-nocturne hover:text-ivory disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-nocturne">→</button>
        </div>
      </div>

      <div role="grid" aria-label="Choose a date" className="mt-5 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => <span key={w} role="columnheader" className="label pb-2 text-center text-nocturne/55">{w}</span>)}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} aria-hidden />;
          const info = byDate.get(date);
          const n = info?.slots.length ?? 0;
          const outOfRange = !info;
          const isSelected = selected === date;
          const dayNum = Number(date.slice(8));
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              data-cal={date}
              tabIndex={date === active ? 0 : -1}
              disabled={n === 0}
              aria-selected={isSelected}
              aria-label={`${longLabel.format(new Date(`${date}T12:00:00Z`))}, ${n ? `${n} time${n > 1 ? "s" : ""} available` : outOfRange ? "not bookable yet" : "fully booked or closed"}`}
              onClick={() => onSelect(date)}
              onKeyDown={(e) => onKey(e, date)}
              className={`relative flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 border text-sm transition-colors duration-300 sm:aspect-[1/0.9] ${
                isSelected ? "border-nocturne bg-nocturne text-ivory"
                  : n ? "border-nocturne/20 bg-white/60 hover:border-nocturne hover:bg-white"
                  : `cursor-not-allowed border-transparent ${outOfRange ? "text-nocturne/25" : "text-nocturne/40"}`
              }`}
            >
              <span className={`display text-xl leading-none sm:text-2xl ${!n && !outOfRange ? "line-through decoration-1" : ""}`}>{dayNum}</span>
              {n > 0 && <span className={`hidden text-[10px] tracking-wide sm:block ${isSelected ? "text-ivory/75" : "text-rouge"}`}>{n} {n === 1 ? "time" : "times"}</span>}
              {n > 0 && <span aria-hidden className={`h-1 w-1 rounded-full sm:hidden ${isSelected ? "bg-ivory" : "bg-rouge"}`} />}
            </button>
          );
        })}
      </div>

      <div className="label mt-4 flex flex-wrap gap-x-6 gap-y-2 text-nocturne/60">
        <span className="flex items-center gap-2"><i className="h-3 w-3 border border-nocturne/30 bg-white/60" /> Available</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 bg-nocturne" /> Selected</span>
        <span className="flex items-center gap-2"><span className="line-through">00</span> Closed or booked</span>
      </div>
    </div>
  );
}
