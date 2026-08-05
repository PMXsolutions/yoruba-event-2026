import { z } from "zod";

export const VOLUNTEER_STATUSES = [
  "new",
  "contacted",
  "approved",
  "assigned",
  "declined",
  "inactive",
] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

export const volunteerFormSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().email("Enter a valid email.").max(320),
  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
  skills: z.string().trim().max(1000).optional().transform((s) => (s && s.length > 0 ? s : undefined)),
  availability: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
  areaOfInterest: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
});

export type VolunteerFormValues = z.infer<typeof volunteerFormSchema>;

export type VolunteerRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  skills: string[];
  availability: string | null;
  areaOfInterest: string | null;
  assignedRole: string | null;
  notes: string | null;
  committeeNotes: string | null;
  status: VolunteerStatus;
  createdAt: string;
  updatedAt: string;
};

export function formatVolunteerStatus(status: VolunteerStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
