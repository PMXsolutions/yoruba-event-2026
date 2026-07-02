import type { EventConfig } from "@/platform/core/types/event";

/**
 * Yoruba Day Canberra 2026 — first Promax Event Platform customer deployment.
 */
export const yorubaDayCanberra2026: EventConfig = {
  slug: "yoruba-day-canberra-2026",
  name: "Yoruba Day Canberra 2026",
  tagline:
    "An elevated yet open-hearted gathering on Ngunnawal country—honouring Yoruba language, music, dress, and cuisine while weaving elders, parents, and youth together in community unity.",
  eventIso: "2026-11-22T14:00:00+11:00",
  heroDateLine: "Saturday, 22 November 2026",
  heroDateDisplay: "Saturday, 22 November 2026 · 2:00 PM",
  heroPlaceLine: "Canberra, ACT",
  location: "Canberra, ACT",
  venue: {
    name: "National Convention Centre Canberra",
    fullAddress: "National Convention Centre, Canberra ACT 2601, Australia",
    mapsUrl: "https://maps.google.com/?q=National+Convention+Centre+Canberra",
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3255.0!2d149.1300!3d-35.2809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDE2JzUxLjIiUyAxNDnCsDA3JzQ4LjAiRQ!5e0!3m2!1sen!2sau!4v1700000000000",
  },
  presenter: "Yoruba Association Canberra",
  organisation: "Yoruba Association Canberra",
  canonicalUrl: "https://yorubadaycanberra.org",
  launchCopy: {
    comingSoonNote:
      "Ticketing, sponsorship packages, and the full programme will be announced soon.",
    registerInterest: "RSVP Now",
    becomeSponsor: "Become a Sponsor",
    sponsorshipAnnouncedSoon: "Sponsorship packages are now open for enquiry.",
    saveTheDate: "Save the Date",
  },
  navItems: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Programme", href: "#programme" },
    { label: "Speakers", href: "#speakers" },
    { label: "Experience", href: "#experience" },
    { label: "Gallery", href: "#gallery" },
    { label: "Sponsors", href: "#sponsors" },
    { label: "RSVP", href: "#rsvp" },
    { label: "FAQ", href: "#faq" },
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
        "A reverent nod to Lagos's Adamu Orisha play—colour, procession, and pageantry presented respectfully for Canberra audiences, old and new.",
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
        "Handwoven Aso Oke, gele artistry, and tailored silhouettes that celebrate craftsmanship—walking the line between tradition and today's diaspora style.",
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
        "A programme built for òmò wọ́n àti àgbà—children, parents, and grandparents—so Canberra's Yoruba community and friends can strengthen bonds in one room.",
    },
  ],
  sponsorTiers: [
    {
      name: "Platinum Patron",
      tier: "platinum",
      pricePlaceholder: "From $15,000",
      benefits: [
        "Title sponsor recognition across all media",
        "Premium stage branding and VIP table (10 guests)",
        "Keynote speaking opportunity",
        "Full-page programme feature",
        "Exclusive pre-event networking reception",
      ],
    },
    {
      name: "Gold Circle",
      tier: "gold",
      pricePlaceholder: "From $8,000",
      benefits: [
        "Prominent logo placement on stage and website",
        "Gold table seating (8 guests)",
        "Half-page programme feature",
        "Social media spotlight campaign",
        "On-site branded activation space",
      ],
    },
    {
      name: "Heritage Partner",
      tier: "heritage",
      pricePlaceholder: "From $3,500",
      benefits: [
        "Logo on website and event signage",
        "Heritage table seating (6 guests)",
        "Programme listing",
        "Community newsletter feature",
        "Certificate of partnership",
      ],
    },
    {
      name: "Community Ally",
      tier: "community",
      pricePlaceholder: "From $1,000",
      benefits: [
        "Name on supporters wall",
        "Community table seating (4 guests)",
        "Programme acknowledgement",
        "Social media thank-you post",
        "In-kind partnership opportunities",
      ],
    },
  ],
  ticketTypes: [
    "General admission",
    "VIP experience",
    "Family bundle",
    "Corporate table",
  ],
  contact: {
    email: "info@yorubadaycanberra.org",
    phone: "+61 2 6123 4567",
  },
  socialLinks: [
    { label: "Instagram", href: "https://instagram.com/yorubadaycanberra", platform: "instagram" },
    { label: "Facebook", href: "https://facebook.com/yorubadaycanberra", platform: "facebook" },
    { label: "X", href: "https://x.com/yorubadaycanberra", platform: "x" },
    { label: "YouTube", href: "https://youtube.com/@yorubadaycanberra", platform: "youtube" },
  ],
  galleryFallback: [
    {
      id: "g1",
      title: "Cultural celebration",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    },
    {
      id: "g2",
      title: "Traditional attire",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    },
    {
      id: "g3",
      title: "Community gathering",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    },
    {
      id: "g4",
      title: "Live performance",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    },
    {
      id: "g5",
      title: "Heritage showcase",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    },
    {
      id: "g6",
      title: "Event highlights reel",
      mediaType: "video",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    },
  ],
};

export const SITE = {
  name: yorubaDayCanberra2026.name,
  tagline: yorubaDayCanberra2026.tagline,
  eventIso: yorubaDayCanberra2026.eventIso,
  heroDateLine: yorubaDayCanberra2026.heroDateLine,
  heroDateDisplay: yorubaDayCanberra2026.heroDateDisplay,
  heroPlaceLine: yorubaDayCanberra2026.heroPlaceLine,
  location: yorubaDayCanberra2026.location,
  venue: yorubaDayCanberra2026.venue,
  presenter: yorubaDayCanberra2026.presenter,
  organisation: yorubaDayCanberra2026.organisation,
  canonicalUrl: yorubaDayCanberra2026.canonicalUrl,
} as const;

export const LAUNCH_COPY = yorubaDayCanberra2026.launchCopy;
export const NAV_ITEMS = yorubaDayCanberra2026.navItems;
export const EXPERIENCE_ITEMS = yorubaDayCanberra2026.experienceItems;
export const SPONSOR_TIERS = yorubaDayCanberra2026.sponsorTiers;
export const TICKET_TYPES = yorubaDayCanberra2026.ticketTypes;
export const SOCIAL_LINKS = yorubaDayCanberra2026.socialLinks;
export const GALLERY_FALLBACK = yorubaDayCanberra2026.galleryFallback;
