import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { updateSubmission } from "@/lib/admin/actions";
import { Badge, Card, Field, PageHead, btn, fmtDate, input } from "@/components/admin/ui";

type Config = {
  eventType?: string; style?: string; templateSlug?: string; palette?: string[];
  board?: { background?: string; items?: Array<{ type: string; color: string; scale: number; rotation: number; text?: string }> };
  preview3d?: { lighting?: string; arrangement?: string; toggles?: Record<string, boolean> };
};

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("event_design_submissions").select("*").eq("id", id).single();
  if (!s) notFound();
  const config = (s.canvas_json ?? {}) as Config;
  const preview3dPath = (s.customizations as { preview3dPath?: string } | null)?.preview3dPath;
  const sign = (p?: string | null) => p ? supabase.storage.from("submissions").createSignedUrl(p, 3600).then((r) => r.data?.signedUrl ?? null) : Promise.resolve(null);
  const [board, threeD, ...refs] = await Promise.all([sign(s.preview_path), sign(preview3dPath), ...(s.reference_paths ?? []).map((p: string) => sign(p))]);
  const counts = (config.board?.items ?? []).reduce<Record<string, number>>((acc, it) => ({ ...acc, [it.type]: (acc[it.type] ?? 0) + 1 }), {});

  return (
    <>
      <PageHead title={`${s.customer_name} · #${s.reference_code}`} back="/admin/submissions"><Badge value={s.status} /></PageHead>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          <Card className="grid gap-4">
            <h2 className="font-semibold">Submitted concept</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {board && <a href={board} target="_blank" rel="noreferrer"><img src={board} alt="Submitted moodboard" className="w-full rounded-lg border border-neutral-200" /></a>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {threeD && <a href={threeD} target="_blank" rel="noreferrer"><img src={threeD} alt="Submitted 3D view" className="w-full rounded-lg border border-neutral-200" /></a>}
            {refs.some(Boolean) && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Client reference images</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="grid grid-cols-3 gap-2">{refs.filter(Boolean).map((u) => <a key={u!} href={u!} target="_blank" rel="noreferrer"><img src={u!} alt="" className="aspect-square w-full rounded-md object-cover" /></a>)}</div>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Customisations</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-neutral-500">Event type</dt><dd>{config.eventType || "–"}</dd></div>
              <div><dt className="text-neutral-500">Style</dt><dd>{config.style || "–"}</dd></div>
              <div><dt className="text-neutral-500">Template</dt><dd>{config.templateSlug || "–"}</dd></div>
              <div><dt className="text-neutral-500">Palette</dt><dd className="mt-1 flex gap-1">{config.palette?.map((c) => <span key={c} title={c} className="h-5 w-5 rounded-full ring-1 ring-neutral-300" style={{ background: c }} />)}</dd></div>
              <div><dt className="text-neutral-500">Board elements</dt><dd>{Object.entries(counts).map(([k, v]) => `${v}× ${k}`).join(", ") || "–"}</dd></div>
              <div><dt className="text-neutral-500">3D preview</dt><dd>{config.preview3d ? `${config.preview3d.arrangement} · ${config.preview3d.lighting} · ${Object.entries(config.preview3d.toggles ?? {}).filter(([, v]) => v).map(([k]) => k).join(", ")}` : "–"}</dd></div>
            </dl>
            <details className="mt-4 text-xs"><summary className="cursor-pointer text-neutral-500">Raw configuration JSON</summary><pre className="mt-2 max-h-80 overflow-auto rounded-md bg-neutral-50 p-3">{JSON.stringify(s.canvas_json, null, 2)}</pre></details>
          </Card>
        </div>
        <div className="grid h-max gap-6">
          <Card>
            <h2 className="font-semibold">Customer</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {[["Name", s.customer_name], ["Email", <a key="e" className="text-blue-700 underline" href={`mailto:${s.customer_email}`}>{s.customer_email}</a>], ["Phone", s.customer_phone], ["Event date", s.preferred_date], ["Location", s.location ?? s.venue], ["Guests", s.guest_count], ["Budget", s.budget_range], ["Submitted", fmtDate(s.created_at)]].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-[110px_1fr]"><dt className="text-neutral-500">{k}</dt><dd>{v || "–"}</dd></div>
              ))}
            </dl>
            {s.concept && <div className="mt-4 text-sm"><p className="text-neutral-500">Concept</p><p className="mt-1 whitespace-pre-wrap">{s.concept}</p></div>}
            {s.special_requests && <div className="mt-4 text-sm"><p className="text-neutral-500">Special requests</p><p className="mt-1 whitespace-pre-wrap">{s.special_requests}</p></div>}
          </Card>
          <Card>
            <form action={updateSubmission} className="grid gap-4">
              <input type="hidden" name="id" value={s.id} />
              <Field label="Status">
                <select name="status" defaultValue={s.status} className={input}>{["new", "reviewing", "contacted", "quoted", "confirmed", "closed", "cancelled"].map((o) => <option key={o}>{o}</option>)}</select>
              </Field>
              <Field label="Internal notes"><textarea name="admin_notes" defaultValue={s.admin_notes ?? ""} rows={4} className={input} /></Field>
              <button className={btn}>Save</button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
