import { requireAdmin } from "@/lib/admin/auth";
import { deleteCategory, saveCategory } from "@/lib/admin/actions";
import { publicStorageUrl } from "@/lib/supabase/service";
import { Card, Field, PageHead, btn, btnGhost, input } from "@/components/admin/ui";

type Row = { id?: string; name?: string; slug?: string; line?: string | null; description?: string | null; tone?: string; accent?: string; position?: number; published?: boolean; image_path?: string | null };

function CategoryForm({ c }: { c: Row }) {
  return (
    <form action={saveCategory} className="grid gap-3 sm:grid-cols-2">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="image_path" value={c.image_path ?? ""} />
      <Field label="Name"><input name="name" defaultValue={c.name} required className={input} /></Field>
      <Field label="Slug"><input name="slug" defaultValue={c.slug} className={input} /></Field>
      <Field label="Short line"><input name="line" defaultValue={c.line ?? ""} className={input} /></Field>
      <Field label="Order"><input type="number" name="position" defaultValue={c.position ?? 0} className={input} /></Field>
      <div className="sm:col-span-2"><Field label="Description"><textarea name="description" defaultValue={c.description ?? ""} rows={2} className={input} /></Field></div>
      <Field label="Atmosphere colour"><input type="color" name="tone" defaultValue={c.tone ?? "#1c1316"} className="h-10 w-20" /></Field>
      <Field label="Accent colour"><input type="color" name="accent" defaultValue={c.accent ?? "#c8a46a"} className="h-10 w-20" /></Field>
      <Field label="Image" hint="Portrait photos look best in the arch."><input type="file" name="image" accept="image/*" className="text-sm" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={c.published ?? true} /> Published</label>
      <div className="flex gap-2 sm:col-span-2"><button className={btn}>{c.id ? "Save" : "Add category"}</button></div>
    </form>
  );
}

export default async function Categories() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("celebration_categories").select("*").order("position");
  return (
    <>
      <PageHead title="Celebration categories" />
      <p className="mb-6 max-w-2xl text-sm text-neutral-600">These drive “The Art of Celebration” chapter and the services page. Until you add one, the site shows setting types drawn from the launch portfolio.</p>
      <div className="grid gap-4">
        {(data ?? []).map((c) => (
          <Card key={c.id} className="grid gap-4 md:grid-cols-[140px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.image_path ? <img src={publicStorageUrl("portfolio", c.image_path)} alt="" className="aspect-[3/4] w-full rounded-lg object-cover" /> : <div className="aspect-[3/4] rounded-lg bg-neutral-100" />}
            <div><CategoryForm c={c} /><form action={deleteCategory} className="mt-2"><input type="hidden" name="id" value={c.id} /><button className={`${btnGhost} text-rose-700`}>Delete</button></form></div>
          </Card>
        ))}
        <Card><h2 className="mb-4 font-semibold">New category</h2><CategoryForm c={{}} /></Card>
      </div>
    </>
  );
}
