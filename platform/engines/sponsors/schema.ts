import { z } from "zod";

export const SPONSOR_STATUSES = [
  "new",
  "contacted",
  "approved",
  "declined",
  "active",
  "completed",
] as const;

export type SponsorStatus = (typeof SPONSOR_STATUSES)[number];

export function createSponsorFormSchema(packages: readonly string[]) {
  return z.object({
    companyName: z.string().trim().min(1, "Company name is required.").max(200),
    contactPerson: z.string().trim().min(1, "Contact person is required.").max(200),
    email: z.string().trim().email("Enter a valid email.").max(320),
    phone: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
    website: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
    package: z
      .string()
      .min(1, "Select a package.")
      .refine((p) => packages.includes(p), { message: "Select a valid package." }),
    message: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
    logoUrl: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
  });
}

export type SponsorFormValues = z.infer<ReturnType<typeof createSponsorFormSchema>>;

export type SponsorRecord = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  website: string | null;
  package: string;
  message: string | null;
  logoUrl: string | null;
  status: SponsorStatus;
  committeeNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatSponsorStatus(status: SponsorStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
