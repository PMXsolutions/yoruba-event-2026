import type { EventConfig } from "@/platform/core/types/event";

/**
 * Yoruba Day Canberra 2026 — first Promax Event Platform customer deployment.
 * Event-specific content lives here; platform engines consume via EventConfig.
 */
export const yorubaDayCanberra2026: EventConfig = {
  slug: "yoruba-day-canberra-2026",
  name: "Yoruba Day Canberra 2026",
  tagline:
    "A warm, dignified gathering on Ngunnawal country—honouring Yoruba language, music, dress, and cuisine, and bringing elders, parents, and youth together in community unity.",
  // Placeholder target for countdown only — exact date remains committee TBC.
  eventIso: "2026-11-22T14:00:00+11:00",
  heroDateLine: "November 2026",
  heroPlaceLine: "Canberra, ACT",
  location: "Canberra, ACT",
  presenter: "Yoruba Association Canberra",
  organisation: "Yoruba Association Canberra",
  launchCopy: {
    comingSoonNote:
      "Ticketing details, sponsorship packages, and the full programme are coming soon. Exact date and venue are to be confirmed by the committee.",
    registerInterest: "Register Interest",
    becomeSponsor: "Become a Sponsor",
    sponsorshipAnnouncedSoon:
      "Sponsorship packages and amounts are coming soon. Early interest is welcome.",
  },
  navItems: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Sponsors", href: "#sponsors" },
    { label: "Register Interest", href: "#rsvp" },
    { label: "Contact", href: "#contact" },
  ],
  experienceItems: [
    {
      title: "Talking drum & Yoruba-led music",
      accent: "♪",
      accentLabel: "Talking drum",
      description:
        "From the pulse of the gangan and dùndún to Fuji, apala-inspired sets, and contemporary Afrobeats—sound as language, calling the community to dance and remembrance. Final line-up to be confirmed.",
    },
    {
      title: "Eyo showcase",
      accent: "◎",
      accentLabel: "Eyo procession",
      description:
        "A respectful nod to Lagos’s Adamu Orisha play—colour, procession, and pageantry presented carefully for Canberra audiences. Subject to committee confirmation.",
    },
    {
      title: "Yoruba cuisine & shared tables",
      accent: "◇",
      accentLabel: "Yoruba cuisine",
      description:
        "Àmàlà, ofada-style rice, rich stews, and small plates that carry home flavours—served so families and friends can break bread together. Menu details coming soon.",
    },
    {
      title: "Aso Oke, gele & Yoruba fashion",
      accent: "✦",
      accentLabel: "Aso Oke and gele",
      description:
        "Handwoven Aso Oke, gele artistry, and tailored silhouettes that celebrate craftsmanship—bridging tradition and today’s diaspora style.",
    },
    {
      title: "Performances & intergenerational storytelling",
      accent: "◆",
      accentLabel: "Elders and youth",
      description:
        "Poetry, dance, and stage moments that lift oral tradition, honour elders, and make space for youth voices. Performers and MC to be confirmed.",
    },
    {
      title: "Family, unity & community connection",
      accent: "◈",
      accentLabel: "Family and community",
      description:
        "A celebration planned for children, parents, and grandparents—so Canberra’s Yoruba community and friends can strengthen bonds together.",
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
};

/** Client-safe re-export for public site components. */
export const SITE = {
  name: yorubaDayCanberra2026.name,
  tagline: yorubaDayCanberra2026.tagline,
  eventIso: yorubaDayCanberra2026.eventIso,
  heroDateLine: yorubaDayCanberra2026.heroDateLine,
  heroPlaceLine: yorubaDayCanberra2026.heroPlaceLine,
  location: yorubaDayCanberra2026.location,
  presenter: yorubaDayCanberra2026.presenter,
  contactEmail: yorubaDayCanberra2026.contact.email,
} as const;

export const LAUNCH_COPY = yorubaDayCanberra2026.launchCopy;
export const NAV_ITEMS = yorubaDayCanberra2026.navItems;
export const EXPERIENCE_ITEMS = yorubaDayCanberra2026.experienceItems;
export const SPONSOR_TIERS = yorubaDayCanberra2026.sponsorTiers;
export const TICKET_TYPES = yorubaDayCanberra2026.ticketTypes;
