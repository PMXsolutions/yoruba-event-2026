import { TICKET_TYPES } from "@/lib/site";
import {
  createRsvpFormSchema,
  fieldErrorsFromZod,
  type RsvpFormValues,
} from "@/platform/engines/rsvp/schema";

/** Event-scoped schema — ticket types from active event config. */
export const rsvpFormSchema = createRsvpFormSchema(TICKET_TYPES);

export type { RsvpFormValues };
export { fieldErrorsFromZod };
