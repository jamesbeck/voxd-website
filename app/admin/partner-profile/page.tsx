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
import OrganisationBrandingTab from "@/components/admin/OrganisationBrandingTab";
import EditPartnerGoCardlessForm from "@/app/admin/organisations/[organisationId]/partnerSettings/EditPartnerGoCardlessForm";

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
        defaultValue="branding"
        tabs={[
          { value: "branding", label: "Logo & Branding" },
          { value: "email", label: "Email Sending" },
          { value: "goCardless", label: "GoCardless" },
          { value: "subPartners", label: "Sub-Partners" },
        ]}
      >
        <TabsContent value="branding">
          <OrganisationBrandingTab
            organisationId={organisation.id}
            logoFileExtension={organisation.logoFileExtension ?? null}
            showLogoOnColour={organisation.showLogoOnColour ?? null}
            primaryColour={organisation.primaryColour ?? null}
            partner={organisation.partner}
            showParentBrandingWarning={false}
          />
        </TabsContent>
        <TabsContent value="email">
          <EmailDomainStatus />
        </TabsContent>
        <TabsContent value="goCardless">
          <EditPartnerGoCardlessForm
            partnerId={organisation.id}
            gcAccessToken={organisation.gcAccessToken ?? undefined}
          />
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
