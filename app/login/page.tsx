import LoginForm from "@/components/LoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";
import { getPartnerByDomain } from "@/lib/getPartnerByDomain";
import { headers } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const domain = headersList.get("x-domain");

  //if no domain use voxd.ai
  const partnerDomain = domain || "voxd.ai";
  const partner = await getPartnerByDomain({ domain: partnerDomain });

  return {
    title: partner?.name
      ? `${partner.name} | WhatsApp AI Chatbots`
      : "VOXD | WhatsApp AI Chatbots",
    description: partner?.name || "WhatsApp AI Chatbots",
  };
}

export default async function LoginPage() {
  const idToken = await verifyIdToken(false);

  const headersList = await headers();
  const domain = headersList.get("x-domain");

  //if no domain use voxd.ai
  const partnerDomain = domain || "voxd.ai";
  const partner = await getPartnerByDomain({ domain: partnerDomain });

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
        email={idToken?.email}
        logoUrl={
          partner?.domain
            ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner?.domain}`
            : undefined
        }
      />
    </div>
  );
}
