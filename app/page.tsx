import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Programme } from "@/components/sections/Programme";
import { Speakers } from "@/components/sections/Speakers";
import { Experience } from "@/components/sections/Experience";
import { Gallery } from "@/components/sections/Gallery";
import { Sponsors } from "@/components/sections/Sponsors";
import { RSVP } from "@/components/sections/RSVP";
import { FAQ } from "@/components/sections/FAQ";
import { Contact } from "@/components/sections/Contact";
import { AnnouncementsBanner } from "@/components/sections/AnnouncementsBanner";
import { VolunteerSection } from "@/components/sections/Volunteer";

function SectionFallback() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center bg-cream/5">
      <div className="h-8 w-8 animate-pulse rounded-full border-2 border-gold/30 border-t-gold-bright" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <AnnouncementsBanner />
      </Suspense>
      <main className="flex-1">
        <Hero />
        <About />
        <Suspense fallback={<SectionFallback />}>
          <Programme />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Speakers />
        </Suspense>
        <Experience />
        <Suspense fallback={<SectionFallback />}>
          <Gallery />
        </Suspense>
        <Sponsors />
        <RSVP />
        <VolunteerSection />
        <Suspense fallback={<SectionFallback />}>
          <FAQ />
        </Suspense>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
