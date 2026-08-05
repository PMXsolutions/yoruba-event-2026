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

export type EventSocialLink = {
  label: string;
  href: string;
  platform: "instagram" | "facebook" | "x" | "youtube" | "linkedin";
};

export type EventVenue = {
  name: string;
  fullAddress: string;
  mapsUrl: string | null;
};

export type EventCalendar = {
  /** ISO start datetime with offset */
  startIso: string;
  /** ISO end datetime with offset */
  endIso: string;
  timezone: string;
};

export type EventSeo = {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
};

export type EventLaunchCopy = {
  comingSoonNote: string;
  registerInterest: string;
  becomeSponsor: string;
  sponsorshipAnnouncedSoon: string;
  saveTheDate: string;
};

/** Full configuration for a single event deployment. */
export type EventConfig = {
  /** Unique slug — future multi-tenant key */
  slug: string;
  name: string;
  tagline: string;
  /** Primary start datetime (ISO 8601 with offset) */
  eventIso: string;
  /** Human-readable date line for hero eyebrow */
  heroDateLine: string;
  /** Full date display e.g. "22 November 2026" */
  heroDateDisplay: string;
  heroPlaceLine: string;
  location: string;
  venue: EventVenue;
  calendar: EventCalendar;
  presenter: string;
  organisation: string;
  /** Platform brand shown in emails / login */
  platformBrand: string;
  description: string;
  launchCopy: EventLaunchCopy;
  navItems: readonly NavItem[];
  experienceItems: readonly ExperienceItem[];
  sponsorTiers: readonly SponsorTier[];
  ticketTypes: readonly string[];
  contact: EventContact;
  socialLinks: readonly EventSocialLink[];
  website: string | null;
  seo: EventSeo;
  branding?: EventBranding;
};
