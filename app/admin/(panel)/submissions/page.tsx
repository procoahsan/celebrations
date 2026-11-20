import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { Badge, Card, Empty, PageHead, fmtDate } from "@/components/admin/ui";

const STATUSES = ["new", "reviewing", "contacted", "quoted", "confirmed", "closed", "cancelled"];

export default async function Submissions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { supabase } = await requireAdmin();
  let q = supabase.from("event_design_submissions").select("id,reference_code,customer_name,customer_email,event_type,preferred_date,guest_count,budget_range,status,created_at,preview_path").order("created_at", { ascending: false }).limit(100);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const { data } = await q;
  const thumbs = await Promise.all((data ?? []).map((s) => s.preview_path ? supabase.storage.from("submissions").createSignedUrl(s.preview_path, 3600).then((r) => r.data?.signedUrl) : null));

  return (
    <>
      <PageHead title="Studio submissions" />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/submissions" className={`rounded-full px-3 py-1 ${!status ? "bg-neutral-900 text-white" : "bg-white ring-1 ring-neutral-200"}`}>All</Link>
        {STATUSES.map((s) => <Link key={s} href={`?status=${s}`} className={`rounded-full px-3 py-1 capitalize ${status === s ? "bg-neutral-900 text-white" : "bg-white ring-1 ring-neutral-200"}`}>{s}</Link>)}
      </div>
      {!data?.length ? <Empty>No submissions{status ? ` with status “${status}”` : ""}.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((s, i) => (
            <Link key={s.id} href={`/admin/submissions/${s.id}`}>
              <Card className="h-full p-0 transition hover:border-neutral-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumbs[i] ? <img src={thumbs[i]!} alt="" className="aspect-[10/7] w-full rounded-t-xl object-cover" /> : <div className="aspect-[10/7] rounded-t-xl bg-neutral-100" />}
                <div className="grid gap-1 p-4 text-sm">
                  <div className="flex items-center justify-between"><span className="font-medium">{s.customer_name}</span><Badge value={s.status} /></div>
                  <span className="text-neutral-600">{s.event_type ?? "Event"} · {s.preferred_date} · {s.guest_count} guests</span>
                  <span className="text-neutral-500">{s.budget_range} · #{s.reference_code} · {fmtDate(s.created_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
