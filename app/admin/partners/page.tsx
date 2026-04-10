import Link from "next/link";
import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import { Button } from "@/components/ui/button";
import PartnersContent from "./partnersContent";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page() {
  const token = await verifyAccessToken();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Partners" },
        ]}
      />
      <PartnersContent superAdmin={!!token.superAdmin}>
        <Button asChild>
          <Link href="/admin/partners/new">New Partner</Link>
        </Button>
      </PartnersContent>
    </Container>
  );
}
