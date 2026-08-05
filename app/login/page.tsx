"use client";

import { useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient, AuthConfigError } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { SITE } from "@/lib/site";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsPending(true);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const supabase = createBrowserSupabaseClient();

      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetError) {
          setError("Unable to send reset email. Please try again or contact your administrator.");
          return;
        }
        setInfo("If an account exists for that email, a reset link has been sent.");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        setError("Invalid email or password. Committee access only.");
        return;
      }

      router.push(redirect.startsWith("/") ? redirect : "/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof AuthConfigError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-gold/20 bg-mahogany/60 p-8 shadow-[0_32px_80px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-10">
      <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.32em] text-gold-bright">
        {SITE.platformBrand}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-cream">
        {mode === "login" ? "Committee sign in" : "Reset password"}
      </h1>
      <p className="mt-2 font-sans text-sm text-cream/65">{SITE.name}</p>
      <p className="mt-1 font-sans text-xs text-gold-muted">
        {SITE.heroDateDisplay} · {SITE.heroPlaceLine}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-400/35 bg-red-950/35 px-4 py-3 text-sm text-red-100"
          >
            {error}
          </div>
        ) : null}
        {info ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100"
          >
            {info}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-muted"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-espresso/80 px-4 py-3 font-sans text-sm text-cream outline-none transition focus:border-gold-bright/50 focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {mode === "login" ? (
          <PasswordField
            id="password"
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? mode === "forgot"
              ? "Sending…"
              : "Signing in…"
            : mode === "forgot"
              ? "Send reset link"
              : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          className="font-sans text-xs text-gold-light underline-offset-4 hover:underline"
          onClick={() => {
            setMode((m) => (m === "login" ? "forgot" : "login"));
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "login" ? "Forgot password?" : "Back to sign in"}
        </button>
        <Link href="/" className="font-sans text-xs text-cream/45 hover:text-cream/70">
          ← Back to public site
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-espresso px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mahogany/50 via-espresso to-espresso" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(201,162,39,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-30" />

      <div className="relative z-10 mb-8 text-center">
        <p className="font-display text-2xl font-semibold text-cream">{SITE.name}</p>
        <p className="mt-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-gold-muted">
          {SITE.platformBrand} · Committee portal
        </p>
      </div>

      <Suspense
        fallback={
          <div
            className="h-8 w-8 animate-pulse rounded-full border-2 border-gold/30 border-t-gold-bright"
            aria-label="Loading"
          />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
