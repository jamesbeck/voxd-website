import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProviderApiKeysTable from "./providerApiKeysTable";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return notFound();
  }

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Provider API Keys" },
        ]}
      />
      <div className="flex items-center justify-between">
        <H1>Provider API Keys</H1>
        <Button asChild>
          <Link href="/admin/provider-api-keys/new">New Key</Link>
        </Button>
      </div>
      <ProviderApiKeysTable />
    </Container>
  );
}
