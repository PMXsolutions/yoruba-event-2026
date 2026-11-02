import Image from "next/image";

type AssociationLogoProps = {
  variant?: "lockup" | "crest";
  className?: string;
  priority?: boolean;
  alt?: string;
};

const ASSETS = {
  lockup: {
    src: "/brand/yoruba-association-act.png",
    width: 276,
    height: 127,
    alt: "Yoruba Association in the ACT. Awa ọmọ Oduduwa.",
  },
  crest: {
    src: "/brand/association-crest.png",
    width: 117,
    height: 103,
    alt: "Yoruba Association in the ACT",
  },
} as const;

/** Association mark. White and gold artwork, meant for a dark background. */
export function AssociationLogo({
  variant = "lockup",
  className,
  priority = false,
  alt,
}: AssociationLogoProps) {
  const asset = ASSETS[variant];
  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={className}
    />
  );
}
