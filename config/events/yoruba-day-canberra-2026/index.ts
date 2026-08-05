import type { EventConfig } from "@/platform/core/types/event";

/**
 * Yoruba Day Canberra 2026 — first Promax Event Platform customer deployment.
 * Event-specific content lives here; platform engines consume via EventConfig.
 */
export const yorubaDayCanberra2026: EventConfig = {
  slug: "yoruba-day-canberra-2026",
  name: "Yoruba Day Canberra 2026",
  tagline:
    "An elevated yet open-hearted gathering on Ngunnawal country—honouring Yoruba language, music, dress, and cuisine while weaving elders, parents, and youth together in community unity.",
  eventIso: "2026-11-22T14:00:00+11:00",
  heroDateLine: "22 November 2026",
  heroDateDisplay: "22 November 2026",
  heroPlaceLine: "Canberra, ACT",
  location: "Canberra, ACT",
  venue: {
    name: "Canberra, ACT",
    fullAddress: "Canberra, ACT, Australia",
    mapsUrl: "https://maps.google.com/?q=Canberra+ACT+Australia",
  },
  calendar: {
    startIso: "2026-11-22T14:00:00+11:00",
    endIso: "2026-11-22T22:00:00+11:00",
    timezone: "Australia/Sydney",
  },
  presenter: "Yoruba Association Canberra",
  organisation: "Yoruba Association Canberra",
  platformBrand: "Promax Event",
  description:
    "Yoruba Day Canberra 2026 celebrates Aso Oke, talking drum, Eyo showcase, cuisine, music, and community unity — presented by Yoruba Association Canberra.",
  website: null,
  launchCopy: {
    comingSoonNote:
      "Register your interest to receive priority updates when ticketing, sponsorship packages and the full programme are announced. This is not a ticket purchase.",
    registerInterest: "Register Interest",
    becomeSponsor: "Become a Sponsor",
    sponsorshipAnnouncedSoon:
      "Sponsorship packages and amounts will be announced soon. Early interest is welcome.",
    saveTheDate: "Save the Date",
  },
  navItems: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Sponsors", href: "#sponsors" },
    { label: "Volunteer", href: "#volunteer" },
    { label: "Register Interest", href: "#rsvp" },
    { label: "Contact", href: "#contact" },
  ],
  experienceItems: [
    {
      title: "Talking drum & Yoruba-led music",
      accent: "♪",
      accentLabel: "Talking drum",
      description:
        "From the pulse of the gangan and dùndún to Fuji, apala-inspired sets, and contemporary Afrobeats—sound as language, calling the community to dance and remembrance.",
    },
    {
      title: "Eyo showcase",
      accent: "◎",
      accentLabel: "Eyo procession",
      description:
        "A reverent nod to Lagos’s Adamu Orisha play—colour, procession, and pageantry presented respectfully for Canberra audiences, old and new.",
    },
    {
      title: "Yoruba cuisine & shared tables",
      accent: "◇",
      accentLabel: "Yoruba cuisine",
      description:
        "Àmàlà, ofada-style rice, rich stews, and small plates that carry home flavours—served so families and friends can break bread together.",
    },
    {
      title: "Aso Oke, gele & Yoruba fashion",
      accent: "✦",
      accentLabel: "Aso Oke and gele",
      description:
        "Handwoven Aso Oke, gele artistry, and tailored silhouettes that celebrate craftsmanship—walking the line between tradition and today’s diaspora style.",
    },
    {
      title: "Performances & intergenerational storytelling",
      accent: "◆",
      accentLabel: "Elders and youth",
      description:
        "Poetry, dance, and stage moments that lift oral tradition, honour elders, and make space for youth voices on the same programme.",
    },
    {
      title: "Family, unity & community connection",
      accent: "◈",
      accentLabel: "Family and community",
      description:
        "A programme built for òmò wọ́n àti àgbà—children, parents, and grandparents—so Canberra’s Yoruba community and friends can strengthen bonds in one room.",
    },
  ],
  sponsorTiers: [
    { name: "Platinum Patron", tier: "platinum" },
    { name: "Gold Circle", tier: "gold" },
    { name: "Heritage Partner", tier: "heritage" },
    { name: "Community Ally", tier: "community" },
  ],
  ticketTypes: [
    "General admission",
    "VIP experience",
    "Family bundle",
    "Corporate table",
  ],
  contact: {
    email: "info@yorubadaycanberra.org",
    phone: null,
  },
  socialLinks: [],
  seo: {
    title: "Yoruba Day Canberra 2026 | Premium Cultural Celebration",
    description:
      "22 November 2026 in Canberra, ACT—Yoruba Day celebrates Aso Oke, talking drum, Eyo showcase, cuisine, music, and community unity. Presented by Yoruba Association Canberra.",
    canonicalUrl: "https://yorubadaycanberra.org",
  },
};

/** Client-safe re-export for public site components. */
export const SITE = {
  name: yorubaDayCanberra2026.name,
  tagline: yorubaDayCanberra2026.tagline,
  eventIso: yorubaDayCanberra2026.eventIso,
  heroDateLine: yorubaDayCanberra2026.heroDateLine,
  heroDateDisplay: yorubaDayCanberra2026.heroDateDisplay,
  heroPlaceLine: yorubaDayCanberra2026.heroPlaceLine,
  location: yorubaDayCanberra2026.location,
  venue: yorubaDayCanberra2026.venue,
  calendar: yorubaDayCanberra2026.calendar,
  presenter: yorubaDayCanberra2026.presenter,
  organisation: yorubaDayCanberra2026.organisation,
  platformBrand: yorubaDayCanberra2026.platformBrand,
  description: yorubaDayCanberra2026.description,
  contactEmail: yorubaDayCanberra2026.contact.email,
  contactPhone: yorubaDayCanberra2026.contact.phone,
  socialLinks: yorubaDayCanberra2026.socialLinks,
  seo: yorubaDayCanberra2026.seo,
  slug: yorubaDayCanberra2026.slug,
} as const;

export const LAUNCH_COPY = yorubaDayCanberra2026.launchCopy;
export const NAV_ITEMS = yorubaDayCanberra2026.navItems;
export const EXPERIENCE_ITEMS = yorubaDayCanberra2026.experienceItems;
export const SPONSOR_TIERS = yorubaDayCanberra2026.sponsorTiers;
export const TICKET_TYPES = yorubaDayCanberra2026.ticketTypes;
