import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Sponsors } from "@/components/sections/Sponsors";
import { RSVP } from "@/components/sections/RSVP";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Experience />
        <Sponsors />
        <RSVP />
      </main>
      <Footer />
    </>
  );
}
