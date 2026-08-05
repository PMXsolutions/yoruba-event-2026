import { SITE } from "@/lib/site";

/** Schema.org Event JSON-LD from event configuration. */
export function EventJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: SITE.name,
    description: SITE.description,
    startDate: SITE.calendar.startIso,
    endDate: SITE.calendar.endIso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: SITE.venue.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Canberra",
        addressRegion: "ACT",
        addressCountry: "AU",
        streetAddress: SITE.venue.fullAddress,
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE.organisation,
      email: SITE.contactEmail,
    },
    url: SITE.seo.canonicalUrl,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
