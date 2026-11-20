import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteProject, removeProjectMedia, setCover, updateProject, uploadProjectMedia } from "@/lib/admin/actions";
import { publicStorageUrl } from "@/lib/supabase/service";
import { Card, Field, PageHead, btn, btnGhost, input } from "@/components/admin/ui";

type Media = { id: string; storage_path: string; poster_path: string | null; media_type: string; alt_text: string | null };

export default async function ProjectAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase.from("portfolio_projects").select("*, portfolio_media(position, media:media_assets(id,storage_path,poster_path,media_type,alt_text))").eq("id", id).single();
  if (!p) notFound();
  const media = ((p.portfolio_media ?? []) as Array<{ position: number; media: Media }>).sort((a, b) => a.position - b.position).map((m) => m.media);

  return (
    <>
      <PageHead title={p.title} back="/admin/portfolio">
        {p.published && <a href={`/portfolio/${p.slug}`} target="_blank" className={btnGhost}>View live ↗</a>}
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <h2 className="font-semibold">Media ({media.length})</h2>
          <form action={uploadProjectMedia} className="mt-4 grid gap-3 rounded-lg border border-dashed border-neutral-300 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="project_id" value={p.id} />
            <Field label="Photos or videos" hint="JPG/PNG/WebP or MP4. Portrait media suits the site's arched frames. Keep videos short and under ~8 MB."><input type="file" name="files" accept="image/*,video/mp4,video/webm" multiple required className="text-sm" /></Field>
            <Field label="Alt text (describes the media)"><input name="alt" className={input} placeholder="Ivory floral arch with crystal strands" /></Field>
            <button className={btn}>Upload</button>
          </form>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {media.map((m) => {
              const src = publicStorageUrl("portfolio", m.storage_path)!;
              const cover = p.cover_media_id === m.id;
              return (
                <div key={m.id} className={`overflow-hidden rounded-lg border ${cover ? "border-amber-600 ring-2 ring-amber-600/30" : "border-neutral-200"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.media_type === "video" ? <video src={src} muted playsInline preload="metadata" className="aspect-[3/4] w-full bg-black object-cover" /> : <img src={src} alt={m.alt_text ?? ""} className="aspect-[3/4] w-full object-cover" />}
                  <div className="flex gap-1 p-2">
                    {!cover && <form action={setCover}><input type="hidden" name="project_id" value={p.id} /><input type="hidden" name="media_id" value={m.id} /><button className={`${btnGhost} text-xs`}>Make cover</button></form>}
                    {cover && <span className="px-2 py-1 text-xs text-amber-700">Cover</span>}
                    <form action={removeProjectMedia} className="ml-auto"><input type="hidden" name="project_id" value={p.id} /><input type="hidden" name="media_id" value={m.id} /><button className={`${btnGhost} text-xs`}>Remove</button></form>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-neutral-500">Video covers use the browser&apos;s first frame for previews; for best results upload a still as the cover.</p>
        </Card>
        <div className="grid h-max gap-6">
          <Card>
            <form action={updateProject} className="grid gap-3">
              <input type="hidden" name="id" value={p.id} />
              <Field label="Title"><input name="title" defaultValue={p.title} required className={input} /></Field>
              <Field label="URL slug"><input name="slug" defaultValue={p.slug} required className={input} /></Field>
              <Field label="Setting / event type"><input name="event_type" defaultValue={p.event_type ?? ""} className={input} /></Field>
              <Field label="Summary"><textarea name="description" defaultValue={p.description ?? ""} rows={4} className={input} /></Field>
              <Field label="Order (lower first)"><input type="number" name="position" defaultValue={p.position ?? 0} className={input} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p.published} /> Published on the website</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p.featured} /> Featured</label>
              <button className={btn}>Save project</button>
            </form>
          </Card>
          <form action={deleteProject}><input type="hidden" name="id" value={p.id} /><button className="text-sm text-rose-700 hover:underline">Delete project</button></form>
        </div>
      </div>
    </>
  );
}
