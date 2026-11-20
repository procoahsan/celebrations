"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "@/lib/motion/gsap";
import { BUDGET_RANGES } from "@/lib/validation";
import type { ReferenceImage } from "@/lib/studio/store";
import styles from "./studio.module.css";

interface Props {
  onClose: () => void;
  capture: () => { previewImage: string | null; preview3dImage?: string };
  configuration: () => Record<string, unknown>;
  references: ReferenceImage[];
}

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done"; reference: string } | { kind: "error"; message: string; fields?: Record<string, string[]> };

export default function SubmitDrawer({ onClose, capture, configuration, references }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [preview, setPreview] = useState<{ previewImage: string | null; preview3dImage?: string }>({ previewImage: null });

  useEffect(() => {
    setPreview(capture());
    gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.9, ease: "expo.out" });
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!preview.previewImage) { setStatus({ kind: "error", message: "We couldn't capture your board. Please try again." }); return; }
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/design-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, configuration: configuration(), previewImage: preview.previewImage, preview3dImage: preview.preview3dImage, references: references.map(({ name, dataUrl }) => ({ name, dataUrl })) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus({ kind: "error", message: json.error ?? "Something went wrong.", fields: json.fields }); return; }
      setStatus({ kind: "done", reference: json.reference });
      try { localStorage.removeItem("c06-studio-draft"); } catch { /* ignore */ }
    } catch {
      setStatus({ kind: "error", message: "Network error. Your design is still saved on this device; please try again." });
    }
  };

  const err = (name: string) => (status.kind === "error" && status.fields?.[name]?.[0]) || null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.drawerScrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="submit-title" data-lenis-prevent>
        <div className="flex items-start justify-between gap-4">
          <h2 id="submit-title" className="display text-4xl md:text-5xl">Send your <em>concept</em></h2>
          <button type="button" onClick={onClose} className="label mt-2" aria-label="Close">Close ×</button>
        </div>

        {status.kind === "done" ? (
          <div className="mt-10 grid gap-5">
            <p className="display text-3xl italic">Thank you.</p>
            <p>Your concept has reached our designers. Reference <strong className="font-mono">{status.reference}</strong>. A confirmation is on its way to your inbox, and we&apos;ll be in touch to talk through details, availability and a quotation.</p>
            <button type="button" onClick={onClose} className="btn-portal on-light w-max">Back to the studio</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-6" noValidate>
            <div className={styles.previews}>
              {preview.previewImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview.previewImage} alt="Your moodboard" />}
              {preview.preview3dImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview.preview3dImage} alt="Your 3D concept view" />}
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-6 md:grid-cols-2">
              <label className="field"><span>Name</span><input ref={first} name="name" required autoComplete="name" />{err("name") && <em className={styles.err}>{err("name")}</em>}</label>
              <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" />{err("email") && <em className={styles.err}>{err("email")}</em>}</label>
              <label className="field"><span>Phone / WhatsApp</span><input name="phone" type="tel" required autoComplete="tel" />{err("phone") && <em className={styles.err}>{err("phone")}</em>}</label>
              <label className="field"><span>Event date</span><input name="eventDate" type="date" min={today} required />{err("eventDate") && <em className={styles.err}>{err("eventDate")}</em>}</label>
              <label className="field"><span>Location / venue</span><input name="location" required />{err("location") && <em className={styles.err}>{err("location")}</em>}</label>
              <label className="field"><span>Guest count</span><input name="guestCount" type="number" min={1} max={5000} required inputMode="numeric" />{err("guestCount") && <em className={styles.err}>{err("guestCount")}</em>}</label>
              <label className="field md:col-span-2"><span>Budget range</span>
                <select name="budgetRange" required defaultValue="">
                  <option value="" disabled>Choose a range…</option>
                  {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
                </select>
                {err("budgetRange") && <em className={styles.err}>{err("budgetRange")}</em>}
              </label>
              <label className="field md:col-span-2"><span>Your concept in words</span><textarea name="concept" placeholder="The feeling, colours, moments you're imagining…" maxLength={2000} /></label>
              <label className="field md:col-span-2"><span>Special requests</span><textarea name="specialRequests" placeholder="Cultural details, accessibility, timings, anything we should know" maxLength={2000} /></label>
            </div>
            <p className="text-sm opacity-70">Your board, 3D view settings and {references.length} reference image{references.length === 1 ? "" : "s"} will be included. This concept is a starting point for conversation, not a quotation or booking.</p>
            {status.kind === "error" && <p role="alert" className={styles.alert}>{status.message}</p>}
            <button type="submit" className="btn-portal ink w-max" disabled={status.kind === "sending"}><span className="dot" />{status.kind === "sending" ? "Sending…" : "Send concept"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
