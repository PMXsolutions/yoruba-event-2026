import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Sponsors } from "@/components/sections/Sponsors";
import { Volunteer } from "@/components/sections/Volunteer";
import { RSVP } from "@/components/sections/RSVP";
import { getFeatureFlags } from "@/lib/feature-flags";

export default function Home() {
  const flags = getFeatureFlags();

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero />
        <About />
        <Experience />
        <Sponsors enquiryOpen={flags.SPONSOR_ENQUIRY_OPEN} />
        <Volunteer interestOpen={flags.VOLUNTEER_INTEREST_OPEN} />
        <RSVP registrationOpen={flags.PUBLIC_REGISTRATION_OPEN} />
      </main>
      <Footer />
    </>
  );
}
