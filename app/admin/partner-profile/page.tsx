import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import RecordTabs from "@/components/admin/RecordTabs";
import { TabsContent } from "@/components/ui/tabs";
import EmailDomainStatus from "./EmailDomainStatus";
import getOrganisationById from "@/lib/getOrganisationById";
import EditSubPartnerMarkupForm from "./EditSubPartnerMarkupForm";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.partner || !accessToken?.partnerId) notFound();

  const organisation = await getOrganisationById({
    organisationId: accessToken.partnerId,
  });

  if (!organisation?.partner) notFound();

  return (
    <Container>
      <BreadcrumbSetter breadcrumbs={[{ label: "Partner Profile" }]} />
      <H1>Partner Profile</H1>

      <RecordTabs
        defaultValue="email"
        tabs={[
          { value: "email", label: "Email Sending" },
          { value: "subPartners", label: "Sub-Partners" },
        ]}
      >
        <TabsContent value="email">
          <EmailDomainStatus />
        </TabsContent>
        <TabsContent value="subPartners">
          <EditSubPartnerMarkupForm
            partnerId={organisation.id}
            defaultSubPartnerMarkupSetupFee={
              organisation.defaultSubPartnerMarkupSetupFee
            }
            defaultSubPartnerMarkupMonthlyFee={
              organisation.defaultSubPartnerMarkupMonthlyFee
            }
            defaultSubPartnerMarkupHourlyRate={
              organisation.defaultSubPartnerMarkupHourlyRate
            }
          />
        </TabsContent>
      </RecordTabs>
    </Container>
  );
}
