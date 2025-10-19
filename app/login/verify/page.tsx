import VerifyLoginForm from "@/components/VerifyLoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";

export default async function VerifyCodePage() {
  await verifyIdToken();

  return <VerifyLoginForm />;
}
