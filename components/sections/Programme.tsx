import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProgrammeTimeline } from "@/components/features/ProgrammeTimeline";
import { fetchProgramme } from "@/lib/data/public-content";

const FALLBACK_PROGRAMME = [
  { id: "1", time_label: "2:00 PM", title: "Doors open & welcome", description: "Registration and cultural welcome.", location: "Main foyer", sort_order: 1 },
  { id: "2", time_label: "2:30 PM", title: "Opening ceremony", description: "Traditional prayers and welcome address.", location: "Grand hall", sort_order: 2 },
  { id: "3", time_label: "3:15 PM", title: "Talking drum showcase", description: "Live performances on the main stage.", location: "Main stage", sort_order: 3 },
  { id: "4", time_label: "5:30 PM", title: "Yoruba cuisine service", description: "Shared tables for families.", location: "Dining area", sort_order: 4 },
  { id: "5", time_label: "8:00 PM", title: "Intergenerational storytelling", description: "Poetry, dance, and stage moments.", location: "Main stage", sort_order: 5 },
  { id: "6", time_label: "9:00 PM", title: "Closing & community dance", description: "Final remarks and open dance floor.", location: "Grand hall", sort_order: 6 },
];

export async function Programme() {
  const items = await fetchProgramme();
  const programme = items.length > 0 ? items : FALLBACK_PROGRAMME;

  return (
    <AnimatedSection
      id="programme"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-cream-warm via-cream to-cream-deep py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-textile-light opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/30 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          surface="onLight"
          eyebrow="The programme"
          title="An evening woven with rhythm, ritual, and reunion"
          subtitle="Times are indicative and will be refined as the full programme is confirmed. Each moment is crafted to honour tradition while welcoming every generation."
        />
        <ProgrammeTimeline items={programme} />
      </div>
    </AnimatedSection>
  );
}
