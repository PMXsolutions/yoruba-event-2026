import { SeatLookupClient } from "@/components/features/SeatLookupClient";

export default async function SeatLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-espresso px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(201,162,39,0.18),transparent_55%)]" />
      <div className="relative z-10 w-full">
        <SeatLookupClient initialToken={params.t} />
      </div>
    </div>
  );
}
