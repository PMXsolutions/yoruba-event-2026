import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-url";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const url = normalizeSupabaseProjectUrl(rawUrl);

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll called from Server Component — middleware handles refresh
        }
      },
    },
  });
}
