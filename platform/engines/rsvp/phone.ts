/** Digits that identify the same handset across +61, 61, and leading 0. */
export function phoneKey(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  let local = digits;
  if (local.startsWith("61") && local.length > 9) local = local.slice(2);
  if (local.startsWith("0")) local = local.slice(1);
  return local;
}
