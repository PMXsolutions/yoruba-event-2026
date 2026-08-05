import { z } from "zod";

export function createRsvpFormSchema(ticketTypes: readonly string[]) {
  const types = ticketTypes as readonly string[];

  return z.object({
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
      .refine((t): t is string => types.includes(t), {
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
}

export type RsvpFormValues = z.infer<ReturnType<typeof createRsvpFormSchema>>;

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

export type RsvpRecord = {
  full_name: string;
  email: string;
  phone: string | null;
  number_of_attendees: number;
  ticket_type: string;
  notes: string | null;
  event_slug: string;
  registration_reference: string;
  status: "new";
};

export function generateRegistrationReference(eventSlug: string): string {
  const prefix = eventSlug
    .split("-")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4) || "EVT";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${time}${rand}`;
}

export function toRsvpRecord(data: RsvpFormValues, eventSlug: string): RsvpRecord {
  return {
    full_name: data.fullName,
    email: data.email.toLowerCase(),
    phone: data.phone ?? null,
    number_of_attendees: data.attendees,
    ticket_type: data.ticketType,
    notes: data.notes ?? null,
    event_slug: eventSlug,
    registration_reference: generateRegistrationReference(eventSlug),
    status: "new",
  };
}
