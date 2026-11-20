import { requireAdmin } from "@/lib/admin/auth";
import { saveContent } from "@/lib/admin/actions";
import { getSiteContent } from "@/lib/content";
import { Card, Field, PageHead, btn, input } from "@/components/admin/ui";

const FIELDS: Array<[keyof Awaited<ReturnType<typeof getSiteContent>>, string, boolean?]> = [
  ["heroTitle", "Opening title (3 words animate best)"], ["heroStatement", "Opening statement", true], ["transformationTitle", "Transformation chapter"],
  ["galleryTitle", "Gallery label"], ["artTitle", "Art of Celebration label"], ["studioTitle", "Studio title"], ["studioStatement", "Studio statement", true],
  ["behindTitle", "Behind the Magic label"], ["storiesTitle", "Client stories label"], ["finaleTitle", "Closing invitation headline"],
];

export default async function ContentAdmin() {
  await requireAdmin();
  const c = await getSiteContent();
  return (
    <>
      <PageHead title="Website content" />
      <form action={saveContent} className="grid gap-6 xl:grid-cols-2">
        <Card className="grid gap-4">
          <h2 className="font-semibold">Homepage copy</h2>
          {FIELDS.map(([key, label, long]) => (
            <Field key={key} label={label}>{long ? <textarea name={key} defaultValue={String(c[key] ?? "")} rows={2} className={input} /> : <input name={key} defaultValue={String(c[key] ?? "")} className={input} />}</Field>
          ))}
        </Card>
        <Card className="grid h-max gap-4">
          <h2 className="font-semibold">Business details</h2>
          <p className="text-sm text-neutral-500">Shown on the contact page only when filled in.</p>
          <Field label="Contact email"><input name="contact_email" type="email" defaultValue={c.contactEmail ?? ""} className={input} /></Field>
          <Field label="Phone"><input name="phone" defaultValue={c.phone ?? ""} className={input} /></Field>
          <Field label="WhatsApp number"><input name="whatsapp" defaultValue={c.whatsapp ?? ""} className={input} /></Field>
          <Field label="Location / service area"><input name="location" defaultValue={c.location ?? ""} className={input} /></Field>
          <Field label="Instagram URL"><input name="instagram_url" type="url" defaultValue={c.instagramUrl} className={input} /></Field>
          <button className={`${btn} w-max`}>Save content</button>
        </Card>
      </form>
    </>
  );
}
