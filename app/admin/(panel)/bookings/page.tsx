import { requireAdmin } from "@/lib/admin/auth";
import { updateBooking } from "@/lib/admin/actions";
import { Badge, Card, Empty, PageHead, btnGhost, fmtDate, input } from "@/components/admin/ui";

export default async function Bookings({ searchParams }: { searchParams: Promise<{ past?: string }> }) {
  const { past } = await searchParams;
  const { supabase } = await requireAdmin();
  const now = new Date().toISOString();
  const q = supabase.from("consultation_bookings").select("*");
  const { data } = past ? await q.lt("starts_at", now).order("starts_at", { ascending: false }).limit(100) : await q.gte("starts_at", now).order("starts_at").limit(200);

  return (
    <>
      <PageHead title="Consultation bookings">
        <a href={past ? "/admin/bookings" : "?past=1"} className={btnGhost}>{past ? "Upcoming" : "Past bookings"}</a>
      </PageHead>
      {!data?.length ? <Empty>No {past ? "past" : "upcoming"} bookings.</Empty> : (
        <div className="grid gap-3">
          {data.map((b) => (
            <Card key={b.id} className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
              <div className="text-sm">
                <p className="font-medium">{b.customer_name} <span className="font-normal text-neutral-500">· {b.customer_email}{b.customer_phone ? ` · ${b.customer_phone}` : ""}</span></p>
                <p className="mt-1">{fmtDate(b.starts_at, b.timezone)} – {new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: b.timezone }).format(new Date(b.ends_at))} <span className="text-neutral-500">({b.timezone})</span></p>
                {(b.topic || b.notes) && <p className="mt-1 text-neutral-600">{[b.topic, b.notes].filter(Boolean).join(" · ")}</p>}
                <p className="mt-1">{b.meet_url ? <a href={b.meet_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Google Meet link</a> : <span className="text-neutral-500">No Meet link yet</span>}</p>
              </div>
              <Badge value={b.status} />
              <form action={updateBooking} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={b.id} />
                <select name="status" defaultValue={b.status} className={`${input} w-auto`}>{["requested", "confirmed", "rescheduled", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select>
                {!b.google_event_id && <input name="meet_url" placeholder="Meet URL (manual)" defaultValue={b.meet_url ?? ""} className={`${input} w-44`} />}
                <button className={btnGhost}>Update</button>
              </form>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-neutral-500">Cancelling a booking that has a Google Calendar event also cancels the event and notifies the attendee.</p>
    </>
  );
}
