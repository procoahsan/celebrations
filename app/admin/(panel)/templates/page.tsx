import { requireAdmin } from "@/lib/admin/auth";
import { saveTemplate } from "@/lib/admin/actions";
import { seedTemplates } from "@/lib/seed";
import { Card, Field, PageHead, btn, input } from "@/components/admin/ui";

export default async function Templates() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("studio_templates").select("*").order("position");
  const rows = data?.length ? data : seedTemplates.map((t, i) => ({ id: "", slug: t.slug, name: t.name, definition: t, position: i, published: true }));

  return (
    <>
      <PageHead title="Event Studio templates" />
      <p className="mb-6 max-w-3xl text-sm text-neutral-600">
        Templates are the starting moods in the Event Studio. Each definition sets the palette (<code>palette</code>), moodboard layout in 0–1 coordinates (<code>layout</code> types: arch, floral, candles, table, sofa, drape, runner, lantern, chandelier), the 3D <code>arrangement</code> (ceremony, stage or banquet), <code>lighting</code> (golden, candlelit or daylight), the inspiration <code>image</code> and suitable <code>eventTypes</code>.
        {!data?.length && " The built-in templates are shown below; saving one stores it in the database, and once any is stored, only stored templates appear on the site."}
      </p>
      <div className="grid gap-4">
        {[...rows, { id: "", slug: "", name: "", definition: { ...seedTemplates[0], slug: "", name: "" }, position: rows.length, published: false }].map((t, i) => (
          <Card key={t.id || `${t.slug}-${i}`}>
            <form action={saveTemplate as unknown as (f: FormData) => Promise<void>} className="grid gap-3 md:grid-cols-[1fr_2fr]">
              {t.id && <input type="hidden" name="id" value={t.id} />}
              <div className="grid h-max gap-3">
                <h2 className="font-semibold">{t.name || "New template"}</h2>
                <Field label="Name"><input name="name" defaultValue={t.name} required className={input} /></Field>
                <Field label="Slug"><input name="slug" defaultValue={t.slug} className={input} /></Field>
                <Field label="Order"><input type="number" name="position" defaultValue={t.position} className={input} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={t.published} /> Published</label>
                <button className={`${btn} w-max`}>Save template</button>
              </div>
              <Field label="Definition (JSON)"><textarea name="definition" defaultValue={JSON.stringify(t.definition, null, 2)} rows={14} className={`${input} font-mono text-xs`} spellCheck={false} /></Field>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
