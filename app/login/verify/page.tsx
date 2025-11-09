import VerifyLoginForm from "@/components/VerifyLoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";
import { getPartnerByDomain } from "@/lib/getPartnerByDomain";
import { headers } from "next/headers";

export default async function VerifyCodePage() {
  await verifyIdToken();

  const headersList = await headers();
  const domain = headersList.get("x-domain");

  //if no domain use voxd.ai
  const partnerDomain = domain || "voxd.ai";
  const partner = await getPartnerByDomain({ domain: partnerDomain });

  return (
    <VerifyLoginForm
      logoUrl={
        partner?.domain
          ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner?.domain}`
          : undefined
      }
    />
  );
}
