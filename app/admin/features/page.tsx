import H1 from "@/components/adminui/H1";
import FeaturesTable from "./featuresTable";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { redirect } from "next/navigation";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  // Only super admins can access this page
  if (!accessToken.superAdmin) {
    redirect("/admin");
  }

  return (
    <Container>
      <H1>Manage Features</H1>

      <FeaturesTable />
    </Container>
  );
}
