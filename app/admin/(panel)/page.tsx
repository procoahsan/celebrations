import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { Badge, Card, PageHead, fmtDate } from "@/components/admin/ui";

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const count = (table: string, filter?: [string, string]) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return q.then((r) => r.count ?? 0);
  };
  const [newSubs, requested, upcoming, pendingReviews, openInquiries, subs, bookings] = await Promise.all([
    count("event_design_submissions", ["status", "new"]),
    count("consultation_bookings", ["status", "requested"]),
    supabase.from("consultation_bookings").select("*", { count: "exact", head: true }).gte("starts_at", new Date().toISOString()).in("status", ["requested", "confirmed"]).then((r) => r.count ?? 0),
    count("testimonials", ["status", "pending"]),
    count("contact_inquiries", ["handled", "false"]),
    supabase.from("event_design_submissions").select("id,reference_code,customer_name,event_type,preferred_date,status,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("consultation_bookings").select("id,customer_name,starts_at,status,meet_url").gte("starts_at", new Date().toISOString()).order("starts_at").limit(6),
  ]);
  const stats = [["New studio concepts", newSubs, "/admin/submissions"], ["Bookings to confirm", requested, "/admin/bookings"], ["Upcoming consultations", upcoming, "/admin/bookings"], ["Reviews awaiting approval", pendingReviews, "/admin/reviews"], ["Open inquiries", openInquiries, "/admin/inquiries"]] as const;

  return (
    <>
      <PageHead title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href}><Card className="transition hover:border-neutral-400"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></Card></Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Latest studio concepts</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {(subs.data ?? []).map((s) => (
              <li key={s.id}><Link href={`/admin/submissions/${s.id}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:text-neutral-600"><span><span className="font-medium">{s.customer_name}</span> · {s.event_type ?? "Event"} · {s.preferred_date}</span><Badge value={s.status} /></Link></li>
            ))}
            {!subs.data?.length && <li className="py-3 text-sm text-neutral-500">No submissions yet.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Upcoming consultations</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {(bookings.data ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span><span className="font-medium">{b.customer_name}</span> · {fmtDate(b.starts_at)}</span><span className="flex items-center gap-2">{b.meet_url && <a href={b.meet_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Meet</a>}<Badge value={b.status} /></span></li>
            ))}
            {!bookings.data?.length && <li className="py-3 text-sm text-neutral-500">Nothing scheduled.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
