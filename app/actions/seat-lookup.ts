"use server";

import { lookupSeat } from "@/platform/engines/seating/queries";
import { getFeatureFlags } from "@/lib/feature-flags";

export async function lookupSeatAction(input: {
  name?: string;
  reference?: string;
  qrToken?: string;
}) {
  if (!getFeatureFlags().SEATING_ENABLED) {
    return { ok: false as const, error: "Seat lookup is not available yet." };
  }
  return lookupSeat(input);
}
