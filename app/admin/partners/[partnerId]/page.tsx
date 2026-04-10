import H1 from "@/components/adminui/H1";
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs from "@/components/admin/RecordTabs";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Partner } from "@/types/types";
import NewPartnerForm from "./newPartnerForm";
import { notFound } from "next/navigation";
import EditPartnerDetailsForm from "./editPartnerDetailsForm";
import EditPartnerDomainsForm from "./editPartnerDomainsForm";
import EditPartnerApiKeysForm from "./editPartnerApiKeysForm";
import EditPartnerPrototypingForm from "./editPartnerPrototypingForm";
import EditPartnerSalesAgentForm from "./editPartnerSalesAgentForm";
import EditPartnerPricingForm from "./editPartnerPricingForm";
import EditPartnerGoCardlessForm from "./editPartnerGoCardlessForm";
import EditPartnerContactLegalForm from "./editPartnerContactLegalForm";
import getPartnerById from "@/lib/getPartnerById";
import QuotesTable from "@/components/admin/QuotesTable";
import db from "@/database/db";

export default async function Page({
  params,
}: {
  params: { partnerId: string };
}) {
  const partnerId = (await params).partnerId;

  let partner: Partner | null = null;

  if (partnerId && partnerId != "new")
    partner = await getPartnerById({ partnerId: partnerId });

  if (!partner && partnerId !== "new") return notFound();

  let organisationName: string | undefined;
  if (partner?.organisationId) {
    const org = await db("organisation")
      .select("name")
      .where("id", partner.organisationId)
      .first();
    organisationName = org?.name;
  }

  let prototypingAgentLabel: string | undefined;
  if (partner?.prototypingAgentId) {
    const agent = await db("agent")
      .select(
        "agent.niceName",
        "agent.name",
        "organisation.name as organisationName",
      )
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("agent.id", partner.prototypingAgentId)
      .first();
    if (agent) {
      prototypingAgentLabel = `${agent.organisationName || "No Organisation"} - ${agent.niceName || agent.name}`;
    }
  }

  let salesBotAgentLabel: string | undefined;
  if (partner?.salesBotAgentId) {
    const agent = await db("agent")
      .select(
        "agent.niceName",
        "agent.name",
        "organisation.name as organisationName",
      )
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("agent.id", partner.salesBotAgentId)
      .first();
    if (agent) {
      salesBotAgentLabel = `${agent.organisationName || "No Organisation"} - ${agent.niceName || agent.name}`;
    }
  }

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Partners", href: "/admin/partners" },
          { label: partner?.name || "New Partner" },
        ]}
      />
      <H1>{partner?.name || "New Partner"}</H1>
      {partner && (
        <>
          <RecordTabs
            defaultValue="details"
            tabs={[
              { value: "details", label: "Details" },
              { value: "domains", label: "Domains" },
              { value: "apikeys", label: "API Keys" },
              { value: "prototyping", label: "Prototyping" },
              { value: "salesagent", label: "Sales Agent" },
              { value: "pricing", label: "Pricing" },
              { value: "gocardless", label: "GoCardless" },
              { value: "contactlegal", label: "Contact & Legal" },
              { value: "quotes", label: "Quotes" },
            ]}
          >
            <TabsContent value="details">
              <EditPartnerDetailsForm
                partnerId={partnerId}
                name={partner.name}
                organisationId={partner.organisationId}
                organisationName={organisationName}
              />
            </TabsContent>
            <TabsContent value="domains">
              <EditPartnerDomainsForm
                partnerId={partnerId}
                domain={partner.domain}
                coreDomain={partner.coreDomain ?? undefined}
                sendEmailFromDomain={partner.sendEmailFromDomain}
              />
            </TabsContent>
            <TabsContent value="apikeys">
              <EditPartnerApiKeysForm
                partnerId={partnerId}
                openAiApiKey={partner.openAiApiKey}
              />
            </TabsContent>
            <TabsContent value="prototyping">
              <EditPartnerPrototypingForm
                partnerId={partnerId}
                prototypingAgentId={partner.prototypingAgentId}
                prototypingAgentLabel={prototypingAgentLabel}
              />
            </TabsContent>
            <TabsContent value="salesagent">
              <EditPartnerSalesAgentForm
                partnerId={partnerId}
                salesBotAgentId={partner.salesBotAgentId}
                salesBotAgentLabel={salesBotAgentLabel}
                salesBotName={partner.salesBotName}
              />
            </TabsContent>
            <TabsContent value="pricing">
              <EditPartnerPricingForm
                partnerId={partnerId}
                hourlyRate={partner.hourlyRate}
                monthlyBaseFee={partner.monthlyBaseFee}
                monthlyPerIntegration={partner.monthlyPerIntegration}
              />
            </TabsContent>
            <TabsContent value="gocardless">
              <EditPartnerGoCardlessForm
                partnerId={partnerId}
                goCardlessMandateLink={partner.goCardlessMandateLink}
              />
            </TabsContent>
            <TabsContent value="contactlegal">
              <EditPartnerContactLegalForm
                partnerId={partnerId}
                salesEmail={partner.salesEmail}
                accountsEmail={partner.accountsEmail}
                legalName={partner.legalName}
                companyNumber={partner.companyNumber}
                registeredAddress={partner.registeredAddress}
                legalEmail={partner.legalEmail}
              />
            </TabsContent>
            <TabsContent value="quotes">
              <QuotesTable partnerId={partner.id} isSuperAdmin={true} />
            </TabsContent>
          </RecordTabs>
        </>
      )}
      {!partner && <NewPartnerForm />}
    </Container>
  );
}
