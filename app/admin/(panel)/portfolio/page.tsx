import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createProject } from "@/lib/admin/actions";
import { publicStorageUrl } from "@/lib/supabase/service";
import { Badge, Card, Empty, Field, PageHead, btn, input } from "@/components/admin/ui";

export default async function PortfolioAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("portfolio_projects").select("id,slug,title,event_type,published,featured,position,cover:media_assets!portfolio_projects_cover_media_id_fkey(storage_path,poster_path,media_type)").order("position");
  return (
    <>
      <PageHead title="Portfolio & media" />
      <p className="mb-6 max-w-2xl text-sm text-neutral-600">Published projects replace the built-in sample portfolio on the website (gallery, portfolio page and project pages). Until at least one project is published, the site shows the supplied launch media.</p>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {!data?.length ? <Empty>No projects yet. Create the first one.</Empty> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((p) => {
              const cover = p.cover as unknown as { storage_path: string; poster_path: string | null; media_type: string } | null;
              const src = cover ? publicStorageUrl("portfolio", cover.media_type === "video" ? cover.poster_path : cover.storage_path) : null;
              return (
                <Link key={p.id} href={`/admin/portfolio/${p.id}`}>
                  <Card className="h-full p-0 transition hover:border-neutral-400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {src ? <img src={src} alt="" className="aspect-[4/5] w-full rounded-t-xl object-cover" /> : <div className="grid aspect-[4/5] place-items-center rounded-t-xl bg-neutral-100 text-xs text-neutral-500">No cover</div>}
                    <div className="flex items-center justify-between gap-2 p-4 text-sm"><span><span className="font-medium">{p.title}</span><br /><span className="text-neutral-500">{p.event_type}</span></span><Badge value={p.published ? "live" : "hidden"} /></div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        <Card className="h-max">
          <h2 className="font-semibold">New project</h2>
          <form action={createProject} className="mt-4 grid gap-3">
            <Field label="Title"><input name="title" required className={input} /></Field>
            <Field label="Setting / event type"><input name="event_type" className={input} placeholder="Nikkah ceremony setting" /></Field>
            <Field label="Summary"><textarea name="description" rows={3} className={input} /></Field>
            <button className={btn}>Create &amp; add media</button>
          </form>
        </Card>
      </div>
    </>
  );
}
