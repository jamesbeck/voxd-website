import type { ReactNode } from "react";
import Image from "next/image";
import type { Partner } from "@/types/types";

interface PartnerGuideShellProps {
  partner: Partner;
  children: ReactNode;
}

export function getPartnerGuideAssets(partner: Partner) {
  const brandColor = partner.organisationPrimaryColour || "#6366f1";
  const organisationLogoUrl =
    partner.organisationLogoFileExtension && partner.organisationId
      ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.organisationId}.${partner.organisationLogoFileExtension}`
      : "/logo.svg";

  return {
    brandColor,
    organisationLogoUrl,
  };
}

export function getPartnerGuideFavicon(partner: Partner) {
  return getPartnerGuideAssets(partner).organisationLogoUrl;
}

export default function PartnerGuideShell({
  partner,
  children,
}: PartnerGuideShellProps) {
  const { organisationLogoUrl } = getPartnerGuideAssets(partner);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 py-4 px-4 bg-white border-b">
        <div className="max-w-3xl xl:max-w-6xl mx-auto flex items-center justify-center">
          <div
            className="py-1 px-2"
            style={
              partner.organisationShowLogoOnColour
                ? { backgroundColor: partner.organisationShowLogoOnColour }
                : undefined
            }
          >
            <Image
              src={organisationLogoUrl}
              alt={partner.name || "Partner"}
              width={180}
              height={60}
              unoptimized
              className="h-8 sm:h-12 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <main className="space-y-8">{children}</main>
      </div>

      <footer className="flex justify-center py-8 px-4">
        <div
          className="py-1 px-2"
          style={
            partner.organisationShowLogoOnColour
              ? { backgroundColor: partner.organisationShowLogoOnColour }
              : undefined
          }
        >
          <Image
            src={organisationLogoUrl}
            alt={partner.name || "Partner"}
            width={120}
            height={40}
            unoptimized
            className="h-8 w-auto object-contain opacity-50"
          />
        </div>
      </footer>
    </div>
  );
}
