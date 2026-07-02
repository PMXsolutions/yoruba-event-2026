import { z } from "zod";

export const volunteerFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(200),
  email: z.string().trim().email("Please enter a valid email.").max(320),
  phone: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v)),
    z.string().trim().max(50).optional(),
  ),
  skills: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v)),
    z.string().trim().max(500).optional(),
  ),
  availability: z.preprocess(
    (v) => (v == null || v === "" ? undefined : String(v)),
    z.string().trim().max(1000).optional(),
  ),
});

export type VolunteerFormValues = z.infer<typeof volunteerFormSchema>;
