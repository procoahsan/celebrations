import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env, integrations } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { readToken, saveToken } from "@/lib/server/tokens";

/**
 * Official Instagram Graph API (Instagram professional account linked to a Facebook Page, via Facebook Login).
 * Comments are imported as *pending* testimonials; nothing appears on the site until an admin approves it.
 */
const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}`;
const SCOPES = ["instagram_basic", "instagram_manage_comments", "pages_show_list", "pages_read_engagement", "business_management"];
interface IgToken { pageToken: string; igUserId: string; username: string }

export const instagramRedirectUri = () => `${env.siteUrl}/api/admin/instagram/callback`;

export function instagramAuthUrl(state: string) {
  const p = new URLSearchParams({ client_id: env.metaAppId!, redirect_uri: instagramRedirectUri(), state, scope: SCOPES.join(","), response_type: "code" });
  return `https://www.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}/dialog/oauth?${p}`;
}

async function graph<T>(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}${path}?${new URLSearchParams(params)}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `Graph API error on ${path}`);
  return json as T;
}

export async function exchangeInstagramCode(code: string) {
  const short = await graph<{ access_token: string }>("/oauth/access_token", { client_id: env.metaAppId!, client_secret: env.metaAppSecret!, redirect_uri: instagramRedirectUri(), code });
  const long = await graph<{ access_token: string }>("/oauth/access_token", { grant_type: "fb_exchange_token", client_id: env.metaAppId!, client_secret: env.metaAppSecret!, fb_exchange_token: short.access_token });
  const pages = await graph<{ data: Array<{ access_token: string; instagram_business_account?: { id: string; username: string } }> }>("/me/accounts", { access_token: long.access_token, fields: "name,access_token,instagram_business_account{id,username}" });
  const page = pages.data.find((p) => p.instagram_business_account);
  if (!page?.instagram_business_account) throw new Error("No Instagram professional account is linked to your Facebook Pages.");
  // Page tokens derived from a long-lived user token do not expire.
  await saveToken("instagram", { pageToken: page.access_token, igUserId: page.instagram_business_account.id, username: page.instagram_business_account.username } satisfies IgToken, `@${page.instagram_business_account.username}`);
}

export async function instagramConnected() {
  return Boolean(integrations.instagram && (await readToken("instagram")));
}

type Comment = { id: string; text: string; username?: string; timestamp: string };

async function storeComment(db: NonNullable<ReturnType<typeof createServiceClient>>, comment: Comment, permalink: string | null, own?: string) {
  if (!comment.text || comment.text.trim().length < 20) return false; // skip emoji-only and short replies
  if (own && comment.username === own) return false;
  const { error } = await db.from("testimonials").insert({ author: comment.username ? `@${comment.username}` : "Instagram client", quote: comment.text.trim(), source: "instagram", source_url: permalink, source_id: comment.id, status: "pending" });
  return !error; // unique source_id prevents duplicates
}

/** Pulls recent comments from the account's latest posts into moderation. */
export async function importInstagramComments() {
  const token = await readToken<IgToken>("instagram");
  const db = createServiceClient();
  if (!token || !db) return { imported: 0 };
  const media = await graph<{ data: Array<{ id: string; permalink: string }> }>(`/${token.igUserId}/media`, { access_token: token.pageToken, fields: "id,permalink", limit: "25" });
  let imported = 0;
  for (const m of media.data) {
    const comments = await graph<{ data: Comment[] }>(`/${m.id}/comments`, { access_token: token.pageToken, fields: "id,text,username,timestamp", limit: "50" }).catch(() => ({ data: [] as Comment[] }));
    for (const c of comments.data) if (await storeComment(db, c, m.permalink, token.username)) imported++;
  }
  return { imported };
}

export function verifySignature(raw: string, header: string | null) {
  if (!header || !env.metaAppSecret) return false;
  const expected = `sha256=${createHmac("sha256", env.metaAppSecret).update(raw).digest("hex")}`;
  return expected.length === header.length && timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}

/** Webhook "comments" change → pending testimonial. */
export async function handleCommentWebhook(payload: { entry?: Array<{ changes?: Array<{ field: string; value: { id: string; text: string; from?: { username?: string }; media?: { id: string } } }> }> }) {
  const db = createServiceClient();
  const token = await readToken<IgToken>("instagram");
  if (!db || !token) return;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const v = change.value;
      let permalink: string | null = null;
      if (v.media?.id) permalink = (await graph<{ permalink?: string }>(`/${v.media.id}`, { access_token: token.pageToken, fields: "permalink" }).catch(() => ({ permalink: undefined }))).permalink ?? null;
      await storeComment(db, { id: v.id, text: v.text, username: v.from?.username, timestamp: new Date().toISOString() }, permalink, token.username);
    }
  }
}

/** Latest post/reel permalinks from the connected account (empty when not connected). */
export async function latestInstagramPermalinks(limit = 12): Promise<string[]> {
  const token = await readToken<IgToken>("instagram");
  if (!token) return [];
  const media = await graph<{ data: Array<{ permalink: string }> }>(`/${token.igUserId}/media`, { access_token: token.pageToken, fields: "permalink", limit: String(limit) });
  return media.data.map((m) => m.permalink).filter(Boolean);
}
