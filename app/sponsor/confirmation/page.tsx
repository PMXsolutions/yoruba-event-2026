import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

type PageProps = {
  searchParams: Promise<{ id?: string; error?: string }>;
};

export default async function SponsorConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <>
      <Navbar />
      <main className="flex min-h-[70vh] flex-1 items-center justify-center bg-gradient-to-b from-cream via-cream-warm to-cream-deep px-5 py-32">
        <div className="max-w-lg rounded-[1.75rem] border border-mahogany/10 bg-cream/95 p-10 text-center shadow-[var(--shadow-card-light)]">
          {hasError ? (
            <>
              <h1 className="font-display text-3xl font-semibold text-mahogany">Something went wrong</h1>
              <p className="mt-4 font-sans text-sm text-mahogany/70">
                We could not process your sponsorship enquiry. Please try again or contact us directly.
              </p>
            </>
          ) : (
            <>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.28em] text-gold-deep">
                Sponsorship enquiry received
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold text-mahogany">Thank you for partnering with us</h1>
              <p className="mt-4 font-sans text-sm leading-relaxed text-mahogany/70">
                Your sponsorship application for {SITE.name} has been received
                {params.id ? ` (reference: ${params.id.slice(0, 8).toUpperCase()})` : ""}.
                Our partnerships team will review your enquiry and respond within 3–5 business days.
              </p>
              <p className="mt-3 font-sans text-xs text-mahogany/55">
                A confirmation email has been sent to your inbox.
              </p>
            </>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/#sponsors">Back to sponsors</ButtonLink>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 font-sans text-sm font-semibold text-mahogany/70 hover:text-mahogany"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
