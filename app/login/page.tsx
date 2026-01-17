import LoginForm from "@/components/LoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getPartnerFromHeaders();

  return {
    title: `${partner?.name} | WhatsApp AI Chatbots`,
    description: `${partner?.name} | WhatsApp AI Chatbots`,
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const idToken = await verifyIdToken(false);
  const { redirectTo } = await searchParams;

  const partner = await getPartnerFromHeaders();

  // Only compute devEmail in development mode - never send to client in production
  let devEmail: string | undefined;
  if (process.env.NODE_ENV === "development") {
    const partnerDomain = process.env.DEVELOPTMENT_PARTNER_DOMAIN;
    if (partnerDomain === "voxd.ai") {
      devEmail = "james.beck@voxd.ai";
    } else if (partnerDomain === "portal.chatfox.ai") {
      devEmail = "james@chatfox.ai";
    }
  }

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
      <LoginForm
        email={devEmail || idToken?.email}
        logoUrl={
          partner?.domain && partner?.logoFileExtension
            ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner?.domain}.${partner?.logoFileExtension}`
            : undefined
        }
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
      />
    </div>
  );
}
