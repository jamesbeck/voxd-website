import H1 from "@/components/adminui/H1";
import GenerateExampleForm from "./generateExampleForm";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page() {
  const accessToken = await verifyAccessToken();
  const superAdmin = accessToken.superAdmin;

  return (
    <div>
      <H1>Example Generator</H1>
      <GenerateExampleForm superAdmin={superAdmin} />
    </div>
  );
}
