import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import RecordTabs from "@/components/admin/RecordTabs";
import { TabsContent } from "@/components/ui/tabs";
import EmailDomainStatus from "./EmailDomainStatus";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.partner || !accessToken?.partnerId) notFound();

  return (
    <Container>
      <BreadcrumbSetter breadcrumbs={[{ label: "Partner Profile" }]} />
      <H1>Partner Profile</H1>

      <RecordTabs
        defaultValue="email"
        tabs={[{ value: "email", label: "Email Sending" }]}
      >
        <TabsContent value="email">
          <EmailDomainStatus />
        </TabsContent>
      </RecordTabs>
    </Container>
  );
}
