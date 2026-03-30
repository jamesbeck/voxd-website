import VerifyLoginForm from "@/components/VerifyLoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";
import type { Metadata } from "next";
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getPartnerFromHeaders();

  return {
    title: partner?.name
      ? `${partner.name} | WhatsApp AI Chatbots`
      : "VOXD | WhatsApp AI Chatbots",
    description: partner?.name || "WhatsApp AI Chatbots",
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
        partner?.organisationPrimaryColour
          ? ({
              "--color-primary": partner?.organisationPrimaryColour,
            } as React.CSSProperties)
          : undefined
      }
    >
      <VerifyLoginForm
        logoUrl={
          partner?.organisationLogoFileExtension && partner?.organisationId
            ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.organisationId}.${partner.organisationLogoFileExtension}`
            : undefined
        }
        showLogoOnColour={partner?.organisationShowLogoOnColour ?? undefined}
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
        devOtp={devOtp}
      />
    </div>
  );
}
