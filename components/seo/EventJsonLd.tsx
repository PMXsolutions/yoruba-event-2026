import { ACTIVE_EVENT } from "@/lib/site";

export default function EventJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ACTIVE_EVENT.name,
    description: ACTIVE_EVENT.tagline,
    startDate: ACTIVE_EVENT.eventIso,
    endDate: new Date(new Date(ACTIVE_EVENT.eventIso).getTime() + 4 * 60 * 60 * 1000).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: ACTIVE_EVENT.venue.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Canberra",
        addressRegion: "ACT",
        addressCountry: "AU",
      },
    },
    organizer: {
      "@type": "Organization",
      name: ACTIVE_EVENT.organisation,
      url: ACTIVE_EVENT.canonicalUrl,
    },
    image: `${ACTIVE_EVENT.canonicalUrl}/opengraph-image`,
    url: ACTIVE_EVENT.canonicalUrl,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
