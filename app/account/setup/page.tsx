"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { completePasswordSetup } from "@/app/actions/auth";

export default function AccountSetup() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const value = params.get("token");
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- The token exists only in the URL fragment, read after hydration.
      setToken(value);
      window.history.replaceState(null, "", "/account/setup");
      setReady(true);
      return;
    }
    setMessage("This setup link is invalid or expired. Ask your administrator to resend it, or use Forgot password.");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-warm p-6 text-mahogany">
      <section className="w-full max-w-md rounded-2xl border border-gold/20 bg-white p-8">
        <h1 className="font-display text-3xl">Set your password</h1>
        <p className="mt-3 text-sm">Choose a password for your committee portal account.</p>
        {message && (
          <p role="status" className="my-4 text-sm">
            {message}
          </p>
        )}
        {!done && (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (password !== confirm) {
                setMessage("Passwords do not match.");
                return;
              }
              if (!token) {
                setMessage("This setup link is invalid or expired. Ask your administrator to resend it.");
                return;
              }
              setPending(true);
              try {
                const result = await completePasswordSetup({ token, password });
                setMessage(result.ok ? result.message : result.error);
                if (result.ok) setDone(true);
              } catch {
                setMessage("Unable to save your password. Please try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            <label className="block text-sm">
              New password
              <input
                className="mt-1 w-full rounded-xl border p-3"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Confirm password
              <input
                className="mt-1 w-full rounded-xl border p-3"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            <button
              disabled={!ready || pending}
              className="w-full rounded-xl bg-espresso p-3 text-cream disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save password"}
            </button>
          </form>
        )}
        <Link className="mt-5 block text-sm underline" href="/login">
          Go to sign in
        </Link>
      </section>
    </main>
  );
}
