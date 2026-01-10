import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import SessionsTable from "./sessionsTable";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page() {
  const token = await verifyAccessToken();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Sessions" },
        ]}
      />
      <H1>All Sessions</H1>

      <SessionsTable superAdmin={!!token.superAdmin} />
    </Container>
  );
}
