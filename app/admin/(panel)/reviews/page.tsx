import { requireAdmin } from "@/lib/admin/auth";
import { addTestimonial, moderateTestimonial, runInstagramImport } from "@/lib/admin/actions";
import { instagramConnected } from "@/lib/integrations/instagram";
import { Badge, Card, Empty, Field, PageHead, btn, btnGhost, fmtDate, input } from "@/components/admin/ui";

export default async function Reviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data }, connected] = await Promise.all([
    supabase.from("testimonials").select("*").eq("status", status).order("created_at", { ascending: false }).limit(200),
    instagramConnected().catch(() => false),
  ]);

  return (
    <>
      <PageHead title="Review moderation">
        {connected && <form action={runInstagramImport}><button className={btnGhost}>Import latest Instagram comments</button></form>}
      </PageHead>
      <p className="mb-6 max-w-2xl text-sm text-neutral-600">Only <strong>approved</strong> reviews appear on the website. Instagram comments arrive here as pending, either through the webhook, the import button, or entered manually with their Instagram link. Approve genuine client reviews only.</p>
      <div className="mb-6 flex gap-2 text-sm">
        {["pending", "approved", "hidden"].map((s) => <a key={s} href={`?status=${s}`} className={`rounded-full px-3 py-1 capitalize ${status === s ? "bg-neutral-900 text-white" : "bg-white ring-1 ring-neutral-200"}`}>{s}</a>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid h-max gap-3">
          {!data?.length && <Empty>No {status} reviews.</Empty>}
          {data?.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">{t.author}{t.event_type ? <span className="font-normal text-neutral-500"> · {t.event_type}</span> : null}</span><span className="flex items-center gap-2 text-neutral-500">{fmtDate(t.created_at)} <Badge value={t.status} /></span></div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{t.quote}</p>
              {t.source_url && <a href={t.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-700 underline">Open on Instagram ↗</a>}
              <form action={moderateTestimonial} className="mt-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={t.id} />
                <label className="mr-2 flex items-center gap-1.5 text-sm"><input type="checkbox" name="featured" defaultChecked={t.featured} /> Featured</label>
                {t.status !== "approved" && <button name="status" value="approved" className={btn}>Approve</button>}
                {t.status !== "hidden" && <button name="status" value="hidden" className={btnGhost}>Hide</button>}
                {t.status === "approved" && <button name="status" value="" className={btnGhost}>Save</button>}
              </form>
            </Card>
          ))}
        </div>
        <Card className="h-max">
          <h2 className="font-semibold">Add a review from Instagram</h2>
          <form action={addTestimonial} className="mt-4 grid gap-3">
            <Field label="Client name or @handle"><input name="author" required className={input} /></Field>
            <Field label="Review text (exactly as written)"><textarea name="quote" required rows={5} className={input} /></Field>
            <Field label="Occasion (optional)"><input name="event_type" className={input} /></Field>
            <Field label="Instagram link" hint="Required: the post or comment where the client wrote this."><input name="source_url" type="url" required pattern="https://(www\.)?instagram\.com/.*" className={input} /></Field>
            <button className={btn}>Add as pending</button>
          </form>
        </Card>
      </div>
    </>
  );
}
