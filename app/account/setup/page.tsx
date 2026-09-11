"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
export default function AccountSetup() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [ready, setReady] = useState(false);
    const [done, setDone] = useState(false);
    const [pending, setPending] = useState(false);
    const [token, setToken] = useState<{
        token_hash: string;
        type: "invite" | "recovery";
    } | null>(null);
    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const hash = params.get("token_hash"), type = params.get("type");
        // Read browser-only invitation data after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (hash && (type === "invite" || type === "recovery")) {
            setToken({ token_hash: hash, type });
            window.history.replaceState(null, "", "/account/setup");
            setReady(true);
        }
        else {
            const client = createBrowserSupabaseClient();
            const code = new URLSearchParams(window.location.search).get("code");
            const session = code ? client.auth.exchangeCodeForSession(code) : client.auth.getSession();
            session.then(({ data }) => { window.history.replaceState(null, "", "/account/setup"); setReady(!!data.session); if (!data.session)
                setMessage("This setup link is invalid or expired. Ask your administrator to resend it, or use Forgot password."); }).catch(() => setMessage("Unable to check the setup link. Please try again."));
        }
    }, []);
    return <main className="flex min-h-screen items-center justify-center bg-cream-warm p-6 text-mahogany"><section className="w-full max-w-md rounded-2xl border border-gold/20 bg-white p-8"><h1 className="font-display text-3xl">Set your password</h1><p className="mt-3 text-sm">Choose a password for your committee portal account.</p>{message && <p role="status" className="my-4 text-sm">{message}</p>}{!done && <form className="mt-6 space-y-4" onSubmit={async (e) => { e.preventDefault(); if (password !== confirm) {
            setMessage("Passwords do not match.");
            return;
        } setPending(true); try {
            const client = createBrowserSupabaseClient();
            if (token) {
                const { error } = await client.auth.verifyOtp(token);
                if (error) {
                    setMessage("This link is invalid or expired. Ask for a new setup email.");
                    return;
                }
                setToken(null);
            }
            const { error } = await client.auth.updateUser({ password });
            if (error) {
                setMessage("Password could not be saved. Use at least 12 characters and try again.");
                return;
            }
            await client.auth.signOut();
            setDone(true);
            setMessage("Password saved. You can now sign in.");
        }
        catch {
            setMessage("Unable to save your password. Please try again.");
        }
        finally {
            setPending(false);
        } }}>
    <label className="block text-sm">New password<input className="mt-1 w-full rounded-xl border p-3" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="block text-sm">Confirm password<input className="mt-1 w-full rounded-xl border p-3" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)}/></label><button disabled={!ready || pending} className="w-full rounded-xl bg-espresso p-3 text-cream disabled:opacity-40">{pending ? "Saving…" : "Save password"}</button></form>}<Link className="mt-5 block text-sm underline" href="/login">Go to sign in</Link></section></main>;
}
