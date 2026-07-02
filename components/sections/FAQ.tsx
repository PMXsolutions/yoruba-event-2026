import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FaqAccordion } from "@/components/features/FaqAccordion";
import { fetchFaq } from "@/lib/data/public-content";

const FALLBACK_FAQ = [
  { id: "1", question: "When and where is Yoruba Day Canberra 2026?", answer: "Saturday, 22 November 2026 in Canberra, ACT. The final venue details will be confirmed closer to the date." },
  { id: "2", question: "How do I register?", answer: "Use the RSVP form on this website. Our committee will follow up with ticketing details." },
  { id: "3", question: "Is the event family-friendly?", answer: "Absolutely — programming is designed for all ages, from children to elders." },
  { id: "4", question: "How can I become a sponsor?", answer: "Complete the sponsorship enquiry form in the Sponsors section." },
];

export async function FAQ() {
  const items = await fetchFaq();
  const faqItems = items.length > 0 ? items : FALLBACK_FAQ;

  return (
    <AnimatedSection
      id="faq"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-cream-deep via-cream to-cream-warm py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/30 to-transparent" />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          surface="onLight"
          eyebrow="Questions & answers"
          title="Everything you need to know"
          subtitle="Can't find what you're looking for? Reach out via the contact section — we're happy to help."
        />
        <div className="mt-12">
          <FaqAccordion
            items={faqItems.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
          />
        </div>
      </div>
    </AnimatedSection>
  );
}
