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

export default async function LoginPage() {
  const idToken = await verifyIdToken(false);

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
