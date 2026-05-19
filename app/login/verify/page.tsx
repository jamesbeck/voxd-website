import VerifyLoginForm from "@/components/VerifyLoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";
import type { Metadata } from "next";
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getPartnerFromHeaders();
  const brandName = partner?.effectivePartnerName || "VOXD";

  return {
    title: `${brandName} | WhatsApp AI Chatbots`,
    description: brandName,
  };
}

export default async function VerifyCodePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await verifyIdToken();
  const { redirectTo } = await searchParams;

  const partner = await getPartnerFromHeaders();

  // Only pass devOtp in development mode - never send to client in production
  const devOtp =
    process.env.NODE_ENV === "development"
      ? process.env.MASTER_OTP_CODE
      : undefined;

  return (
    <div
      style={
        partner?.effectivePartnerPrimaryColour
          ? ({
              "--color-primary": partner?.effectivePartnerPrimaryColour,
            } as React.CSSProperties)
          : undefined
      }
    >
      <VerifyLoginForm
        logoUrl={
          partner?.effectivePartnerLogoFileExtension &&
          partner?.effectivePartnerOrganisationId
            ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.effectivePartnerOrganisationId}.${partner.effectivePartnerLogoFileExtension}`
            : undefined
        }
        showLogoOnColour={
          partner?.effectivePartnerShowLogoOnColour ?? undefined
        }
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
        devOtp={devOtp}
      />
    </div>
  );
}
