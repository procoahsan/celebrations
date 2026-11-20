import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Service-role client for validated server-side writes (public form submissions, integrations). Never expose to the browser. */
export function createServiceClient() {
  if (!env.supabaseUrl || !env.serviceRoleKey) return null;
  return createClient(env.supabaseUrl, env.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Anonymous public client for cached public reads (RLS-limited). */
export function createPublicClient() {
  if (!env.supabaseUrl || !env.supabaseKey) return null;
  return createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function publicStorageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return undefined;
  if (/^(https?:)?\//.test(path)) return path;
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
