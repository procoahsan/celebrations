"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./auth";
import { cancelConsultationEvent } from "@/lib/integrations/google";
import { importInstagramComments } from "@/lib/integrations/instagram";
import { deleteToken } from "@/lib/server/tokens";
import { zonedToUtc } from "@/lib/server/availability";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);

export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------- Submissions ----------
export async function updateSubmission(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("event_design_submissions").update({ status: str(form, "status"), admin_notes: str(form, "admin_notes") || null, updated_at: new Date().toISOString() }).eq("id", str(form, "id"));
  revalidatePath("/admin/submissions");
}

// ---------- Bookings ----------
export async function updateBooking(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(form, "id");
  const status = str(form, "status");
  const meetUrl = str(form, "meet_url");
  if (status === "cancelled") {
    const { data } = await supabase.from("consultation_bookings").select("google_event_id").eq("id", id).single();
    if (data?.google_event_id) await cancelConsultationEvent(data.google_event_id).catch(() => {});
  }
  await supabase.from("consultation_bookings").update({ status, ...(meetUrl ? { meet_url: meetUrl } : {}) }).eq("id", id);
  revalidatePath("/admin/bookings");
}

// ---------- Availability ----------
export async function saveAvailability(form: FormData) {
  const { supabase } = await requireAdmin();
  const slot = Math.max(15, Math.min(240, Number(str(form, "slot_minutes")) || 45));
  const rows = [0, 1, 2, 3, 4, 5, 6].flatMap((weekday) => {
    if (form.get(`on_${weekday}`) !== "on") return [];
    const start = str(form, `start_${weekday}`), end = str(form, `end_${weekday}`);
    return start && end && end > start ? [{ weekday, start_time: start, end_time: end, slot_minutes: slot }] : [];
  });
  await supabase.from("availability_rules").delete().gte("weekday", 0);
  if (rows.length) await supabase.from("availability_rules").insert(rows);
  revalidatePath("/admin/availability");
}

export async function addBlackout(form: FormData) {
  const { supabase } = await requireAdmin();
  const starts = str(form, "starts_at"), ends = str(form, "ends_at");
  const toUtc = (v: string) => { const [d, t] = v.split("T"); return zonedToUtc(d, t.slice(0, 5)).toISOString(); };
  if (starts && ends) await supabase.from("availability_blackouts").insert({ starts_at: toUtc(starts), ends_at: toUtc(ends), reason: str(form, "reason") || null });
  revalidatePath("/admin/availability");
}

export async function removeBlackout(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("availability_blackouts").delete().eq("id", str(form, "id"));
  revalidatePath("/admin/availability");
}

// ---------- Portfolio & media ----------
async function uploadMedia(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], file: File, alt: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `media/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data, error: dbError } = await supabase.from("media_assets").insert({ storage_path: path, alt_text: alt || null, media_type: file.type.startsWith("video/") ? "video" : "image", is_public: true }).select("id").single();
  if (dbError) throw dbError;
  return data.id as string;
}

export async function createProject(form: FormData) {
  const { supabase } = await requireAdmin();
  const title = str(form, "title");
  if (!title) return;
  const { data } = await supabase.from("portfolio_projects").insert({ title, slug: slugify(str(form, "slug") || title), event_type: str(form, "event_type") || null, description: str(form, "description") || null, published: false }).select("id").single();
  revalidatePath("/admin/portfolio");
  if (data) redirect(`/admin/portfolio/${data.id}`);
}

export async function updateProject(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(form, "id");
  await supabase.from("portfolio_projects").update({
    title: str(form, "title"), slug: slugify(str(form, "slug")), event_type: str(form, "event_type") || null, description: str(form, "description") || null,
    published: form.get("published") === "on", featured: form.get("featured") === "on", position: Number(str(form, "position")) || 0, updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/portfolio"); revalidatePath("/portfolio"); revalidatePath("/");
}

export async function uploadProjectMedia(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(form, "project_id");
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const { count } = await supabase.from("portfolio_media").select("*", { count: "exact", head: true }).eq("project_id", id);
  let position = count ?? 0;
  for (const file of files) {
    const mediaId = await uploadMedia(supabase, file, str(form, "alt"));
    await supabase.from("portfolio_media").insert({ project_id: id, media_id: mediaId, position: position++ });
    const { data: project } = await supabase.from("portfolio_projects").select("cover_media_id").eq("id", id).single();
    if (!project?.cover_media_id) await supabase.from("portfolio_projects").update({ cover_media_id: mediaId }).eq("id", id);
  }
  revalidatePath(`/admin/portfolio/${id}`);
}

export async function setCover(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("portfolio_projects").update({ cover_media_id: str(form, "media_id") }).eq("id", str(form, "project_id"));
  revalidatePath(`/admin/portfolio/${str(form, "project_id")}`);
}

export async function removeProjectMedia(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("portfolio_media").delete().eq("project_id", str(form, "project_id")).eq("media_id", str(form, "media_id"));
  revalidatePath(`/admin/portfolio/${str(form, "project_id")}`);
}

export async function deleteProject(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("portfolio_projects").delete().eq("id", str(form, "id"));
  revalidatePath("/admin/portfolio");
  redirect("/admin/portfolio");
}

// ---------- Testimonials ----------
export async function moderateTestimonial(form: FormData) {
  const { supabase } = await requireAdmin();
  const status = str(form, "status");
  await supabase.from("testimonials").update({ ...(status ? { status } : {}), featured: form.get("featured") === "on" }).eq("id", str(form, "id"));
  revalidatePath("/admin/reviews"); revalidatePath("/reviews"); revalidatePath("/");
}

export async function addTestimonial(form: FormData) {
  const { supabase } = await requireAdmin();
  const quote = str(form, "quote"), author = str(form, "author"), url = str(form, "source_url");
  if (!quote || !author || !/^https:\/\/(www\.)?instagram\.com\//.test(url)) return;
  await supabase.from("testimonials").insert({ quote, author, event_type: str(form, "event_type") || null, source: "instagram", source_url: url, status: "pending" });
  revalidatePath("/admin/reviews");
}

export async function runInstagramImport() {
  await requireAdmin();
  await importInstagramComments();
  revalidatePath("/admin/reviews");
}

// ---------- CMS ----------
export async function saveContent(form: FormData) {
  const { supabase } = await requireAdmin();
  const keys = ["heroTitle", "heroStatement", "transformationTitle", "galleryTitle", "artTitle", "studioTitle", "studioStatement", "behindTitle", "storiesTitle", "finaleTitle"];
  const rows = keys.filter((k) => str(form, k)).map((k) => ({ key: k, value: str(form, k), updated_at: new Date().toISOString() }));
  if (rows.length) await supabase.from("site_content").upsert(rows);
  const settings = { contact_email: str(form, "contact_email") || null, phone: str(form, "phone") || null, whatsapp: str(form, "whatsapp") || null, instagram_url: str(form, "instagram_url") || null, location: str(form, "location") || null, updated_at: new Date().toISOString() };
  const { data: existing } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  if (existing) await supabase.from("site_settings").update(settings).eq("id", existing.id);
  else await supabase.from("site_settings").insert(settings);
  revalidatePath("/", "layout");
}

export async function saveCategory(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(form, "id");
  const image = form.get("image");
  let image_path = str(form, "image_path") || null;
  if (image instanceof File && image.size > 0) {
    const path = `categories/${crypto.randomUUID()}.${image.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, image, { contentType: image.type });
    if (!error) image_path = path;
  }
  const row = { name: str(form, "name"), slug: slugify(str(form, "slug") || str(form, "name")), line: str(form, "line") || null, description: str(form, "description") || null, tone: str(form, "tone") || "#1c1316", accent: str(form, "accent") || "#c8a46a", position: Number(str(form, "position")) || 0, published: form.get("published") === "on", image_path };
  if (id) await supabase.from("celebration_categories").update(row).eq("id", id);
  else if (row.name) await supabase.from("celebration_categories").insert(row);
  revalidatePath("/admin/categories"); revalidatePath("/"); revalidatePath("/services");
}

export async function deleteCategory(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("celebration_categories").delete().eq("id", str(form, "id"));
  revalidatePath("/admin/categories");
}

export async function saveTemplate(form: FormData): Promise<{ error?: string } | void> {
  const { supabase } = await requireAdmin();
  let definition: unknown;
  try { definition = JSON.parse(str(form, "definition")); } catch { return { error: "Definition must be valid JSON." }; }
  const row = { name: str(form, "name"), slug: slugify(str(form, "slug") || str(form, "name")), definition, position: Number(str(form, "position")) || 0, published: form.get("published") === "on" };
  const id = str(form, "id");
  if (id) await supabase.from("studio_templates").update(row).eq("id", id);
  else await supabase.from("studio_templates").insert(row);
  revalidatePath("/admin/templates"); revalidatePath("/design-your-event");
}

export async function markInquiry(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("contact_inquiries").update({ handled: form.get("handled") === "true" }).eq("id", str(form, "id"));
  revalidatePath("/admin/inquiries");
}

export async function disconnectIntegration(form: FormData) {
  await requireAdmin();
  const provider = str(form, "provider");
  if (provider === "google" || provider === "instagram") await deleteToken(provider);
  revalidatePath("/admin/integrations");
}
