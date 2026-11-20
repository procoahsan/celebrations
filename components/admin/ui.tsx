import Link from "next/link";
import type { ReactNode } from "react";

export const input = "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";
export const btn = "inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100";

export function PageHead({ title, children, back }: { title: string; children?: ReactNode; back?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back} className="text-sm text-neutral-500 hover:text-neutral-900">← Back</Link>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-neutral-200 bg-white p-5 ${className}`}>{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-neutral-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

const tones: Record<string, string> = {
  new: "bg-blue-50 text-blue-700", reviewing: "bg-amber-50 text-amber-700", contacted: "bg-violet-50 text-violet-700", quoted: "bg-indigo-50 text-indigo-700",
  confirmed: "bg-emerald-50 text-emerald-700", closed: "bg-neutral-100 text-neutral-600", cancelled: "bg-rose-50 text-rose-700", requested: "bg-amber-50 text-amber-700",
  rescheduled: "bg-violet-50 text-violet-700", pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", hidden: "bg-neutral-100 text-neutral-600",
  live: "bg-emerald-50 text-emerald-700", missing: "bg-rose-50 text-rose-700", partial: "bg-amber-50 text-amber-700",
};
export function Badge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tones[value] ?? "bg-neutral-100 text-neutral-700"}`}>{value}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">{children}</p>;
}

export const fmtDate = (iso: string | null | undefined, tz = process.env.DEFAULT_TIMEZONE || "America/Chicago") =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(iso)) : "–";
