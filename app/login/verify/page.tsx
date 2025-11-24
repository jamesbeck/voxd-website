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

  return (
    <div
      style={
        partner?.colour
          ? ({
              "--color-primary": `#${partner?.colour}`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <VerifyLoginForm
        logoUrl={
          partner?.domain
            ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner?.domain}`
            : undefined
        }
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
      />
    </div>
  );
}
