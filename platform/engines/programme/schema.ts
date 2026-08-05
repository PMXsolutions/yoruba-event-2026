import { z } from "zod";

export const programmeItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().trim().max(200).optional(),
  speaker: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export type ProgrammeItemFormValues = z.infer<typeof programmeItemSchema>;

export type ProgrammeItemRecord = {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  speaker: string | null;
  category: string | null;
  displayOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
