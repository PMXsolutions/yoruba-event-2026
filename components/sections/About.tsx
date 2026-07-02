import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site";

export function About() {
  return (
    <AnimatedSection
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-cream via-cream-warm to-cream-deep py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-textile-light opacity-70" />
      <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] translate-x-1/4 -translate-y-1/3 rounded-full bg-gold/12 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/4 rounded-full bg-mahogany/8 blur-[90px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          surface="onLight"
          eyebrow="Our purpose"
          title="Where heritage meets the heartbeat of Canberra"
          subtitle={`${SITE.name} is a warmly elevated gathering for Yoruba families, the wider African diaspora, and friends of the culture—rooted in respect for elders, joy for youth, and pride in who we are.`}
        />
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
          <div className="group relative overflow-hidden rounded-[1.75rem] border border-mahogany/10 bg-cream/80 p-8 shadow-[var(--shadow-card-light)] backdrop-blur-sm transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_36px_80px_-40px_rgba(58,36,25,0.28)] sm:p-10 md:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-gold via-gold-deep to-gold-muted opacity-80" />
            <p className="relative pl-5 font-sans text-base leading-[1.8] text-mahogany/88 sm:text-lg">
              We celebrate Yoruba heritage through food, dress, music, and gathering—whether you
              wear Aso Oke and gele, grew up with talking drums at family parties, or are simply
              curious to learn. All are welcome to share in an atmosphere that is premium, warm,
              and unmistakably communal.
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-[1.75rem] border border-gold/20 bg-gradient-to-br from-mahogany via-mahogany to-espresso p-8 text-cream shadow-[var(--shadow-card-dark)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-gold-bright/25 hover:shadow-[0_40px_90px_-36px_rgba(0,0,0,0.65),0_0_0_1px_rgba(201,162,39,0.12)] sm:p-10 md:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-[0.15]" />
            <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-gold-bright/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            <p className="relative font-display text-2xl font-medium leading-snug text-cream sm:text-3xl md:text-[2.1rem] md:leading-[1.35]">
              <span className="text-gold-light">Ìwà omolúwabi</span>—good character and mutual
              care—guides how we host: families seated together, elders honoured, and young people
              encouraged to lead on stage and behind the scenes.
            </p>
            <p className="relative mt-7 border-t border-white/10 pt-7 font-sans text-sm leading-relaxed text-cream/72 sm:text-[0.95rem]">
              Presented with care by {SITE.presenter}, this day is for everyone who wishes to
              stand in unity with Canberra’s Yoruba community.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
