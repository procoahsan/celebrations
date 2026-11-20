import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt } from "./crypto";

export async function saveToken(provider: "google" | "instagram", payload: object, accountLabel?: string) {
  const db = createServiceClient();
  if (!db) throw new Error("Supabase service role is not configured");
  const { error } = await db.from("integration_tokens").upsert({ provider, encrypted_payload: encrypt(JSON.stringify(payload)), account_label: accountLabel ?? null, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function readToken<T>(provider: "google" | "instagram"): Promise<(T & { accountLabel?: string | null }) | null> {
  const db = createServiceClient();
  if (!db) return null;
  const { data } = await db.from("integration_tokens").select("encrypted_payload, account_label").eq("provider", provider).maybeSingle();
  if (!data) return null;
  try { return { ...(JSON.parse(decrypt(data.encrypted_payload)) as T), accountLabel: data.account_label }; } catch { return null; }
}

export async function deleteToken(provider: "google" | "instagram") {
  await createServiceClient()?.from("integration_tokens").delete().eq("provider", provider);
}
