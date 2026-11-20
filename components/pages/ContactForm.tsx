"use client";
import { useState, type FormEvent } from "react";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string; fields?: Record<string, string[]> };

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "sending" });
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) return setStatus({ kind: "error", message: json?.error ?? "Network error. Please try again.", fields: json?.fields });
    setStatus({ kind: "done" });
  };
  const err = (n: string) => (status.kind === "error" && status.fields?.[n]?.[0]) || null;

  if (status.kind === "done") return <div role="status" className="grid gap-4"><p className="display text-4xl italic">Thank you.</p><p className="opacity-80">Your message is with us. We&apos;ll reply soon. A copy is on its way to your inbox.</p></div>;

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="field"><span>Your name</span><input name="name" required autoComplete="name" />{err("name") && <em className="text-sm not-italic text-rouge">{err("name")}</em>}</label>
        <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" />{err("email") && <em className="text-sm not-italic text-rouge">{err("email")}</em>}</label>
        <label className="field"><span>Phone (optional)</span><input name="phone" type="tel" autoComplete="tel" /></label>
        <label className="field"><span>Occasion</span><input name="eventType" placeholder="Wedding, mehndi, birthday…" /></label>
      </div>
      <label className="field"><span>Tell us what you imagine</span><textarea name="message" required rows={5} placeholder="The date, the place, the feeling…" />{err("message") && <em className="text-sm not-italic text-rouge">{err("message")}</em>}</label>
      {status.kind === "error" && <p role="alert" className="border-l-2 border-rouge bg-rouge/10 px-4 py-3 text-sm">{status.message}</p>}
      <button type="submit" disabled={status.kind === "sending"} className="btn-portal ink w-max"><span className="dot" />{status.kind === "sending" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
