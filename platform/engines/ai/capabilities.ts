/**
 * Promax AI Engine — capability registry (no API calls in v1).
 * Implement providers behind these interfaces in a future release.
 */

export type AiCapabilityId =
  | "faq-assistant"
  | "sponsor-drafting"
  | "committee-assistant"
  | "announcement-drafting"
  | "meeting-minutes"
  | "social-media-drafting";

export type AiCapability = {
  id: AiCapabilityId;
  name: string;
  description: string;
  status: "planned" | "beta" | "live";
  requiredRole: "public" | "committee" | "admin";
};

export const AI_CAPABILITIES: readonly AiCapability[] = [
  {
    id: "faq-assistant",
    name: "FAQ Assistant",
    description: "Answers common attendee questions from event knowledge base.",
    status: "planned",
    requiredRole: "public",
  },
  {
    id: "sponsor-drafting",
    name: "Sponsor Proposal Drafting",
    description: "Drafts sponsorship deck copy from tier configuration.",
    status: "planned",
    requiredRole: "committee",
  },
  {
    id: "committee-assistant",
    name: "Committee Assistant",
    description: "Helps committee members with planning queries and summaries.",
    status: "planned",
    requiredRole: "committee",
  },
  {
    id: "announcement-drafting",
    name: "Announcement Drafting",
    description: "Drafts public announcements from bullet points.",
    status: "planned",
    requiredRole: "committee",
  },
  {
    id: "meeting-minutes",
    name: "Meeting Minute Summarisation",
    description: "Summarises committee meeting notes into action items.",
    status: "planned",
    requiredRole: "committee",
  },
  {
    id: "social-media-drafting",
    name: "Social Media Drafting",
    description: "Creates platform-specific posts from event updates.",
    status: "planned",
    requiredRole: "committee",
  },
] as const;

/** Future: AiProvider interface for OpenAI, Anthropic, etc. */
export type AiCompletionRequest = {
  capabilityId: AiCapabilityId;
  prompt: string;
  eventSlug: string;
  userId?: string;
};

export type AiCompletionResponse = {
  content: string;
  model: string;
  tokensUsed?: number;
};

export type AiProvider = {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
};
