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
  benefits: readonly string[];
  pricePlaceholder: string;
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
  mapsUrl: string;
  mapsEmbedUrl: string;
};

export type EventLaunchCopy = {
  comingSoonNote: string;
  registerInterest: string;
  becomeSponsor: string;
  sponsorshipAnnouncedSoon: string;
  saveTheDate: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  mediaType: "image" | "video";
  url: string;
  thumbnailUrl?: string;
};

/** Full configuration for a single event deployment. */
export type EventConfig = {
  slug: string;
  name: string;
  tagline: string;
  eventIso: string;
  heroDateLine: string;
  heroDateDisplay: string;
  heroPlaceLine: string;
  location: string;
  venue: EventVenue;
  presenter: string;
  organisation: string;
  canonicalUrl: string;
  launchCopy: EventLaunchCopy;
  navItems: readonly NavItem[];
  experienceItems: readonly ExperienceItem[];
  sponsorTiers: readonly SponsorTier[];
  ticketTypes: readonly string[];
  contact: EventContact;
  socialLinks: readonly EventSocialLink[];
  galleryFallback: readonly GalleryItem[];
  branding?: EventBranding;
};
