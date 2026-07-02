export const SITE = {
  name: "Yoruba Day Canberra 2026",
  tagline:
    "An elevated yet open-hearted gathering on Ngunnawal country—honouring Yoruba language, music, dress, and cuisine while weaving elders, parents, and youth together in community unity.",
  /** Countdown target (November 2026; exact day TBC) */
  eventIso: "2026-11-22T14:00:00+11:00",
  /** Shown prominently in the hero */
  heroDateLine: "November 2026",
  heroPlaceLine: "Canberra, ACT",
  /** Shorter label for nav / mobile menu */
  location: "Canberra, ACT",
  presenter: "Yoruba Association Canberra",
} as const;

export type NavItem = { label: string; href: string };

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "RSVP", href: "#rsvp" },
  { label: "Contact", href: "#contact" },
] as const;

export const EXPERIENCE_ITEMS = [
  {
    title: "Talking drum & Yoruba-led music",
    description:
      "From the pulse of the gangan and dùndún to Fuji, apala-inspired sets, and contemporary Afrobeats—sound as language, calling the community to dance and remembrance.",
  },
  {
    title: "Eyo showcase",
    description:
      "A reverent nod to Lagos’s Adamu Orisha play—colour, procession, and pageantry presented respectfully for Canberra audiences, old and new.",
  },
  {
    title: "Yoruba cuisine & shared tables",
    description:
      "Àmàlà, ofada-style rice, rich stews, and small plates that carry home flavours—served so families and friends can break bread together.",
  },
  {
    title: "Aso Oke, gele & Yoruba fashion",
    description:
      "Handwoven Aso Oke, gele artistry, and tailored silhouettes that celebrate craftsmanship—walking the line between tradition and today’s diaspora style.",
  },
  {
    title: "Performances & intergenerational storytelling",
    description:
      "Poetry, dance, and stage moments that lift oral tradition, honour elders, and make space for youth voices on the same programme.",
  },
  {
    title: "Family, unity & community connection",
    description:
      "A programme built for òmò wọ́n àti àgbà—children, parents, and grandparents—so Canberra’s Yoruba community and friends can strengthen bonds in one room.",
  },
] as const;

export const SPONSOR_TIERS = [
  { name: "Platinum Patron", tier: "platinum" as const },
  { name: "Gold Circle", tier: "gold" as const },
  { name: "Heritage Partner", tier: "heritage" as const },
  { name: "Community Ally", tier: "community" as const },
] as const;

export const TICKET_TYPES = [
  "General admission",
  "VIP experience",
  "Family bundle",
  "Corporate table",
] as const;
