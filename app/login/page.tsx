"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError("Invalid email or password. Committee access only.");
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-gold/20 bg-mahogany/60 p-8 shadow-[var(--shadow-card-dark)] backdrop-blur-xl sm:p-10">
      <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.32em] text-gold-bright">
        Committee portal
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-cream">Sign in</h1>
      <p className="mt-2 font-sans text-sm text-cream/65">{SITE.name}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? (
          <div role="alert" className="rounded-xl border border-red-400/35 bg-red-950/35 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className="mb-2 block font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-espresso/80 px-4 py-3 font-sans text-sm text-cream outline-none focus:border-gold-bright/50"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-espresso/80 px-4 py-3 font-sans text-sm text-cream outline-none focus:border-gold-bright/50"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-xs text-cream/45">
        Committee members only. Contact your administrator for access.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-espresso via-mahogany to-espresso px-5 py-16">
      <Suspense
        fallback={
          <div className="h-8 w-8 animate-pulse rounded-full border-2 border-gold/30 border-t-gold-bright" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
