/** Manual database types — align with supabase/migrations */

export type RsvpRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  number_of_attendees: number;
  ticket_type: string;
  notes: string | null;
  registration_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type SponsorRow = {
  id: string;
  company: string;
  contact_person: string;
  email: string;
  phone: string | null;
  website: string | null;
  package: string;
  logo_url: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export type VolunteerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  skills: string[];
  availability: string | null;
  assignment: string | null;
  status: "pending" | "approved" | "assigned" | "declined";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryRow = {
  id: string;
  title: string | null;
  media_type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type ProgrammeRow = {
  id: string;
  time_label: string;
  title: string;
  description: string | null;
  location: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type SpeakerRow = {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type RoleSlug = "super_admin" | "admin" | "committee" | "volunteer";

export type CommitteeUserRow = {
  id: string;
  user_id: string;
  role_id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityLogRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
