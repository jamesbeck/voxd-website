import H1 from "@/components/adminui/H1";
import ExamplesTable from "./examplesTable";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page() {
  const accessToken = await verifyAccessToken();
  const superAdmin = accessToken.superAdmin;

  return (
    <Container>
      <H1>Manage Examples</H1>

      <ExamplesTable superAdmin={superAdmin} />
    </Container>
  );
}
