import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export async function issueState(name: string) {
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(`oauth_${name}`, state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return state;
}

export async function checkState(name: string, state: string | null) {
  const store = await cookies();
  const expected = store.get(`oauth_${name}`)?.value;
  store.delete(`oauth_${name}`);
  return Boolean(state && expected && state === expected);
}
