/** Text a driver returns for a failed request. */
export function databaseErrorText(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return "";
  return [error.message, error.code].filter((part): part is string => typeof part === "string" && part.length > 0).join("\n");
}

/** DNS, TCP, and TLS failures from either the old hosted client or SQL Server. */
export function isDatabaseConnectivityFailure(message: string): boolean {
  return /fetch failed|enotfound|econnrefused|econnreset|eai_again|getaddrinfo|ehostunreach|enetunreach|und_err_|socket hang up|etimedout|esocket|etimeout|failed to connect|certificate verify failed|hostname\/ip does not match/i.test(
    message,
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
