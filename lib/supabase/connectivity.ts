/** Text supabase-js returns for a failed request, including the network cause. */
export function supabaseErrorText(error: {
  message?: string;
  details?: string;
  hint?: string;
} | null | undefined): string {
  if (!error) return "";
  return [error.message, error.details, error.hint]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join("\n");
}

/**
 * DNS, TCP, and TLS failures. supabase-js reports these as
 * `TypeError: fetch failed` with the cause (ENOTFOUND, certificate mismatch) in `details`.
 */
export function isSupabaseConnectivityFailure(message: string): boolean {
  return /fetch failed|enotfound|econnrefused|econnreset|eai_again|getaddrinfo|ehostunreach|enetunreach|und_err_|socket hang up|etimedout|certificate verify failed|hostname\/ip does not match/i.test(
    message,
  );
}
