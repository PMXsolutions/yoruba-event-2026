import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  isPublished: z.boolean().default(false),
  scheduledFor: z.string().optional(),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt: string | null;
  scheduledFor: string | null;
  archivedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
