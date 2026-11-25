import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Sponsors } from "@/components/sections/Sponsors";
import { PreviousEdition } from "@/components/sections/PreviousEdition";
import { Volunteer } from "@/components/sections/Volunteer";
import { RSVP } from "@/components/sections/RSVP";
import { fetchPublicSponsorshipAccount } from "@/platform/engines/sponsors/account-store";

import { listMedia } from '@/lib/gallery/store';

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sponsorshipAccount, media] = await Promise.all([fetchPublicSponsorshipAccount(), listMedia()]);
  const photos = media.filter(i => i.collection === 'Yoruba Day 2026' && i.kind === 'photo').slice(0, 12).map(i => ({src: `/api/gallery/media/${i.id}`, alt: `Yoruba Day 2026 — ${i.title}`}));

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero />
        <About />
        <PreviousEdition photos={photos} />
        <Experience />
        <Sponsors account={sponsorshipAccount} />
        <RSVP />
        <Volunteer />
      </main>
      <Footer />
    </>
  );
}
