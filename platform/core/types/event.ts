/** Promax Event Platform — event configuration contract (multi-tenant ready). */

export type NavItem = { label: string; href: string };

export type ExperienceItem = {
  title: string;
  accent: string;
  accentLabel: string;
  description: string;
};

export type SponsorTier = {
  name: string;
  tier: "platinum" | "gold" | "heritage" | "community";
};

export type EventBranding = {
  primaryFont?: string;
  accentColor?: string;
};

export type EventContact = {
  email: string;
  phone: string | null;
};

export type EventLaunchCopy = {
  comingSoonNote: string;
  registerInterest: string;
  becomeSponsor: string;
  sponsorshipAnnouncedSoon: string;
};

/** Full configuration for a single event deployment. */
export type EventConfig = {
  /** Unique slug — future multi-tenant key */
  slug: string;
  name: string;
  tagline: string;
  eventIso: string;
  heroDateLine: string;
  heroPlaceLine: string;
  location: string;
  presenter: string;
  organisation: string;
  launchCopy: EventLaunchCopy;
  navItems: readonly NavItem[];
  experienceItems: readonly ExperienceItem[];
  sponsorTiers: readonly SponsorTier[];
  ticketTypes: readonly string[];
  contact: EventContact;
  branding?: EventBranding;
};
