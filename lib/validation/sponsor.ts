import { z } from "zod";

export const sponsorFormSchema = z.object({
  company: z.string().trim().min(1, "Company name is required.").max(200),
  contactPerson: z.string().trim().min(1, "Contact person is required.").max(200),
  email: z.string().trim().email("Please enter a valid email.").max(320),
  phone: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v)),
    z.string().trim().max(50).optional(),
  ),
  website: z.preprocess(
    (v) => {
      const s = v == null ? "" : String(v).trim();
      return s.length === 0 ? undefined : s;
    },
    z.string().url("Please enter a valid URL.").max(500).optional(),
  ),
  package: z.string().trim().min(1, "Please select a package."),
  message: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v)),
    z.string().trim().max(2000).optional(),
  ),
  logoDataUrl: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v)),
    z.string().max(2_000_000).optional(),
  ),
});

export type SponsorFormValues = z.infer<typeof sponsorFormSchema>;
