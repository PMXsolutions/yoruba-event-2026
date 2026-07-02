import { z } from "zod";
import { TICKET_TYPES } from "@/lib/site";

const ticketTypes = TICKET_TYPES as readonly string[];

export const rsvpFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Please enter your full name.")
    .max(200, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email address.")
    .max(320, "Email is too long."),
  phone: z.preprocess(
    (v) => (v == null ? "" : String(v)),
    z
      .string()
      .trim()
      .max(50, "Phone number is too long.")
      .transform((s) => (s.length > 0 ? s : undefined)),
  ),
  attendees: z.coerce
    .number()
    .int("Number of guests must be a whole number.")
    .min(1, "At least one guest is required.")
    .max(50, "For groups over 50, please contact us by email."),
  ticketType: z
    .string()
    .min(1, "Please select a ticket type.")
    .refine((t): t is (typeof TICKET_TYPES)[number] => ticketTypes.includes(t), {
      message: "Please select a valid ticket type.",
    }),
  notes: z.preprocess(
    (v) => (v == null ? "" : String(v)),
    z
      .string()
      .trim()
      .max(2000, "Notes are too long (maximum 2000 characters).")
      .transform((s) => (s.length > 0 ? s : undefined)),
  ),
});

export type RsvpFormValues = z.infer<typeof rsvpFormSchema>;

const formFieldKeys: (keyof RsvpFormValues)[] = [
  "fullName",
  "email",
  "phone",
  "attendees",
  "ticketType",
  "notes",
];

export function fieldErrorsFromZod(
  error: z.ZodError,
): Partial<Record<keyof RsvpFormValues, string>> {
  const out: Partial<Record<keyof RsvpFormValues, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (
      typeof key === "string" &&
      formFieldKeys.includes(key as keyof RsvpFormValues) &&
      !out[key as keyof RsvpFormValues]
    ) {
      out[key as keyof RsvpFormValues] = issue.message;
    }
  }
  return out;
}
