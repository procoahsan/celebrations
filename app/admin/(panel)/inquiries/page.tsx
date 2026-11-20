import { requireAdmin } from "@/lib/admin/auth";
import { markInquiry } from "@/lib/admin/actions";
import { Badge, Card, Empty, PageHead, btnGhost, fmtDate } from "@/components/admin/ui";

export default async function Inquiries() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("contact_inquiries").select("*").order("handled").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHead title="Contact inquiries" />
      {!data?.length ? <Empty>No inquiries yet.</Empty> : (
        <div className="grid gap-3">
          {data.map((m) => (
            <Card key={m.id} className={m.handled ? "opacity-60" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                <p><span className="font-medium">{m.name}</span> · <a className="text-blue-700 underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ""}{m.event_type ? ` · ${m.event_type}` : ""}</p>
                <span className="flex items-center gap-2 text-neutral-500">{fmtDate(m.created_at)} <Badge value={m.handled ? "closed" : "new"} /></span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
              <form action={markInquiry} className="mt-3"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="handled" value={String(!m.handled)} /><button className={btnGhost}>{m.handled ? "Reopen" : "Mark handled"}</button></form>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
