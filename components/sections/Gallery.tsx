import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GalleryLightbox, type GalleryMediaItem } from "@/components/features/GalleryLightbox";
import { fetchGallery } from "@/lib/data/public-content";
import { GALLERY_FALLBACK } from "@/lib/site";

export async function Gallery() {
  const rows = await fetchGallery();
  const items: GalleryMediaItem[] =
    rows.length > 0
      ? rows.map((r) => ({
          id: r.id,
          title: r.title ?? "Event moment",
          mediaType: r.media_type,
          url: r.url,
          thumbnailUrl: r.thumbnail_url ?? undefined,
        }))
      : GALLERY_FALLBACK.map((g) => ({
          id: g.id,
          title: g.title,
          mediaType: g.mediaType,
          url: g.url,
          thumbnailUrl: g.thumbnailUrl,
        }));

  return (
    <AnimatedSection
      id="gallery"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-cream via-cream-warm to-cream-deep py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-textile-light opacity-40" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          surface="onLight"
          eyebrow="Moments & memories"
          title="A glimpse of celebration"
          subtitle="Immerse yourself in the colour, rhythm, and warmth of Yoruba cultural gatherings. Tap any image to explore in full."
        />
        <div className="mt-14">
          <GalleryLightbox items={items} />
        </div>
      </div>
    </AnimatedSection>
  );
}
