import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpeakerCard } from "@/components/features/SpeakerCard";
import { fetchSpeakers } from "@/lib/data/public-content";

const FALLBACK_SPEAKERS = [
  { id: "1", name: "Chief Adebayo Ogundimu", title: "Elder & Cultural Patron", bio: "A respected community elder championing Yoruba language preservation across Canberra.", photo_url: null, sort_order: 1 },
  { id: "2", name: "Dr. Funmilayo Akinwale", title: "Keynote Speaker", bio: "Cultural historian specialising in Yoruba diaspora narratives in Australia.", photo_url: null, sort_order: 2 },
  { id: "3", name: "Tunde Bakare", title: "Master of Ceremonies", bio: "Award-winning broadcaster weaving humour and cultural fluency into every programme.", photo_url: null, sort_order: 3 },
];

export async function Speakers() {
  const items = await fetchSpeakers();
  const speakers = items.length > 0 ? items : FALLBACK_SPEAKERS;

  return (
    <AnimatedSection
      id="speakers"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-espresso via-mahogany to-espresso py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Voices of the evening"
          title="Meet the speakers & cultural custodians"
          subtitle="Elders, artists, and community leaders who will guide us through an evening of remembrance, celebration, and forward-looking unity."
        />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {speakers.map((speaker, index) => (
            <SpeakerCard key={speaker.id} speaker={speaker} index={index} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
