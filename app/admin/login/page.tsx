"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { btn, input } from "@/components/admin/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(params.get("denied") ? "This account doesn't have admin access." : null);
  const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-lg font-semibold">The Celebrations admin</p>
        {!supabase ? (
          <p className="mt-4 text-sm text-neutral-600">Supabase isn&apos;t configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to the environment, run the migrations, then create an admin user (see README).</p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-sm"><span className="font-medium">Email</span><input name="email" type="email" required autoComplete="email" className={input} /></label>
            <label className="grid gap-1.5 text-sm"><span className="font-medium">Password</span><input name="password" type="password" required autoComplete="current-password" className={input} /></label>
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            <button className={btn} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
