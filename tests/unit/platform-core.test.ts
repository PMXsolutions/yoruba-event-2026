import { describe, expect, it } from "vitest";
import { paginateItems } from "@/lib/pagination";
import { permissionsForRole, isPlatformRole } from "@/lib/auth/permissions";
import { formatActivityLabel } from "@/lib/activity/labels";
import { getFeatureFlags } from "@/lib/feature-flags";

describe("paginateItems", () => {
  it("slices and reports ranges", () => {
    const items = Array.from({ length: 30 }, (_, i) => i + 1);
    const slice = paginateItems(items, 2, 10);
    expect(slice.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(slice.from).toBe(11);
    expect(slice.to).toBe(20);
    expect(slice.totalPages).toBe(3);
  });

  it("clamps out-of-range pages", () => {
    const slice = paginateItems([1, 2, 3], 99, 10);
    expect(slice.page).toBe(1);
    expect(slice.items).toEqual([1, 2, 3]);
  });
});

describe("permissionsForRole", () => {
  it("gives SUPER_ADMIN user.manage", () => {
    expect(permissionsForRole("SUPER_ADMIN")).toContain("user.manage");
  });

  it("keeps READ_ONLY without write", () => {
    const perms = permissionsForRole("READ_ONLY");
    expect(perms).toContain("rsvp.read");
    expect(perms).not.toContain("rsvp.write");
  });

  it("recognises product roles", () => {
    expect(isPlatformRole("RSVP_MANAGER")).toBe(true);
    expect(isPlatformRole("HACKER")).toBe(false);
  });
});

describe("formatActivityLabel", () => {
  it("labels status changes", () => {
    expect(formatActivityLabel("rsvp.status_updated", { status: "confirmed" })).toContain(
      "confirmed",
    );
  });
});

describe("getFeatureFlags", () => {
  it("defaults public registration open", () => {
    expect(getFeatureFlags().PUBLIC_REGISTRATION_OPEN).toBe(true);
    expect(getFeatureFlags().SMS_ENABLED).toBe(false);
  });
});
