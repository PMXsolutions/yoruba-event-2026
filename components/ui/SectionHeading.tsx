type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Text colours: dark sections (espresso) vs light (cream) surfaces */
  surface?: "onDark" | "onLight";
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  surface = "onDark",
}: SectionHeadingProps) {
  const isLight = surface === "onLight";
  const alignClass =
    align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left";
  const eyebrowTone = isLight
    ? "text-gold-deep"
    : "text-gold-bright";
  const titleTone = isLight ? "text-mahogany" : "text-cream";
  const subtitleTone = isLight ? "text-mahogany/72" : "text-cream/78";
  const lineClass = isLight
    ? "from-gold-deep/80 via-gold to-gold-light/40"
    : "from-gold-bright via-gold to-transparent";

  return (
    <div className={`${alignClass} mb-12 sm:mb-16 md:mb-20`}>
      <p
        className={`mb-4 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.42em] sm:text-xs ${eyebrowTone}`}
      >
        {eyebrow}
      </p>
      <div
        className={`mb-6 h-px max-w-full bg-gradient-to-r ${lineClass} sm:mb-8 ${
          align === "center" ? "mx-auto w-16 sm:w-20" : "w-16 sm:w-24"
        }`}
        aria-hidden
      />
      <h2
        className={`font-display text-[clamp(1.85rem,4.5vw,3.35rem)] font-semibold leading-[1.12] tracking-tight sm:text-5xl md:text-[3.25rem] ${titleTone}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-6 max-w-2xl font-sans text-base leading-[1.75] sm:mt-7 sm:text-lg ${subtitleTone} ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
