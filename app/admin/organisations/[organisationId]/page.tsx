import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs, { RecordTab } from "@/components/admin/RecordTabs";
import H1 from "@/components/adminui/H1";
import getOrganisationById from "@/lib/getOrganisationById";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import AgentsTable from "./agentsTable";
import NewOrganisationForm from "./newOrganisationForm";
import AdminUsersTable from "./adminUsersTable";
import ChatUsersTable from "./chatUsersTable";
import QuotesTable from "@/components/admin/QuotesTable";
import OrganisationActions from "./organisationActions";
import NewQuoteButton from "@/components/admin/NewQuoteButton";
import AboutTab from "./aboutTab";
import LogoTab from "./logoTab";
import ProviderApiKeysTable from "@/app/admin/provider-api-keys/providerApiKeysTable";
import userCanViewOrganisation from "@/lib/organisationAccess";
import EditPartnerDetailsForm from "./partnerSettings/EditPartnerDetailsForm";
import EditPartnerDomainsForm from "./partnerSettings/EditPartnerDomainsForm";
import EditPartnerApiKeysForm from "./partnerSettings/EditPartnerApiKeysForm";
import EditPartnerPrototypingForm from "./partnerSettings/EditPartnerPrototypingForm";
import EditPartnerSalesAgentForm from "./partnerSettings/EditPartnerSalesAgentForm";
import EditPartnerPricingForm from "./partnerSettings/EditPartnerPricingForm";
import EditPartnerGoCardlessForm from "./partnerSettings/EditPartnerGoCardlessForm";
import EditPartnerContactLegalForm from "./partnerSettings/EditPartnerContactLegalForm";
import db from "@/database/db";

export default async function Page({
  params,
  searchParams,
}: {
  params: { organisationId: string };
  searchParams: { tab?: string };
}) {
  const token = await verifyAccessToken();

  const organisationId = (await params).organisationId;
  const activeTab = (await searchParams).tab || "agents";

  let organisation;

  if (organisationId && organisationId != "new")
    organisation = await getOrganisationById({
      organisationId: organisationId,
    });
  if (!organisation && organisationId !== "new") return notFound();

  if (
    organisation &&
    !(await userCanViewOrganisation({ organisationId, accessToken: token }))
  ) {
    return notFound();
  }

  const showPartnerTabs =
    !!organisation?.partner && (token.superAdmin || token.partner);

  let providerApiKeyLabel: string | undefined;
  let prototypingAgentLabel: string | undefined;
  let salesBotAgentLabel: string | undefined;

  if (organisation?.providerApiKeyId) {
    const providerApiKey = await db("providerApiKey")
      .leftJoin("provider", "providerApiKey.providerId", "provider.id")
      .leftJoin(
        "organisation as keyOrganisation",
        "providerApiKey.organisationId",
        "keyOrganisation.id",
      )
      .select(
        db.raw(
          `CASE WHEN "providerApiKey"."id" IS NOT NULL THEN "provider"."name" || ' — ' || LEFT("providerApiKey"."key", 6) || '...' || RIGHT("providerApiKey"."key", 4) || COALESCE(' (' || "keyOrganisation"."name" || ')', '') ELSE NULL END as "providerApiKeyLabel"`,
        ),
      )
      .where("providerApiKey.id", organisation.providerApiKeyId)
      .first();

    providerApiKeyLabel = providerApiKey?.providerApiKeyLabel;
  }

  if (organisation?.prototypingAgentId) {
    const agent = await db("agent")
      .select(
        "agent.niceName",
        "agent.name",
        "organisation.name as organisationName",
      )
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("agent.id", organisation.prototypingAgentId)
      .first();
    if (agent) {
      prototypingAgentLabel = `${agent.organisationName || "No Organisation"} - ${agent.niceName || agent.name}`;
    }
  }

  if (organisation?.salesBotAgentId) {
    const agent = await db("agent")
      .select(
        "agent.niceName",
        "agent.name",
        "organisation.name as organisationName",
      )
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("agent.id", organisation.salesBotAgentId)
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
          { label: "Organisations", href: "/admin/organisations" },
          { label: organisation?.name || "New Organisation" },
        ]}
      />
      <H1>{organisation?.name || "New Organisation"}</H1>
      {organisation && (
        <>
          <RecordTabs
            value={activeTab}
            tabs={
              [
                {
                  value: "about",
                  label: "About",
                  href: `/admin/organisations/${organisation.id}?tab=about`,
                },
                {
                  value: "logo",
                  label: "Logo & Branding",
                  href: `/admin/organisations/${organisation.id}?tab=logo`,
                },
                {
                  value: "adminUsers",
                  label: "Admin Users",
                  href: `/admin/organisations/${organisation.id}?tab=adminUsers`,
                },
                {
                  value: "chatUsers",
                  label: "Chat Users",
                  href: `/admin/organisations/${organisation.id}?tab=chatUsers`,
                },
                {
                  value: "agents",
                  label: "Agents",
                  href: `/admin/organisations/${organisation.id}?tab=agents`,
                },
                ...(showPartnerTabs
                  ? [
                      {
                        value: "partnerDetails",
                        label: "Partner Details",
                        href: `/admin/organisations/${organisation.id}?tab=partnerDetails`,
                      },
                      {
                        value: "partnerDomains",
                        label: "Domains",
                        href: `/admin/organisations/${organisation.id}?tab=partnerDomains`,
                      },
                      {
                        value: "partnerApiKey",
                        label: "Partner API Key",
                        href: `/admin/organisations/${organisation.id}?tab=partnerApiKey`,
                      },
                      {
                        value: "partnerPrototyping",
                        label: "Prototyping",
                        href: `/admin/organisations/${organisation.id}?tab=partnerPrototyping`,
                      },
                      {
                        value: "partnerSalesAgent",
                        label: "Sales Agent",
                        href: `/admin/organisations/${organisation.id}?tab=partnerSalesAgent`,
                      },
                      {
                        value: "partnerPricing",
                        label: "Pricing",
                        href: `/admin/organisations/${organisation.id}?tab=partnerPricing`,
                      },
                      {
                        value: "partnerGoCardless",
                        label: "GoCardless",
                        href: `/admin/organisations/${organisation.id}?tab=partnerGoCardless`,
                      },
                      {
                        value: "partnerContactLegal",
                        label: "Contact & Legal",
                        href: `/admin/organisations/${organisation.id}?tab=partnerContactLegal`,
                      },
                    ]
                  : []),
                ...(token.superAdmin || token.partner
                  ? [
                      {
                        value: "providerApiKeys",
                        label: "API Keys",
                        href: `/admin/organisations/${organisation.id}?tab=providerApiKeys`,
                      },
                      {
                        value: "quotes",
                        label: "Quotes",
                        href: `/admin/organisations/${organisation.id}?tab=quotes`,
                      },
                    ]
                  : []),
              ] satisfies RecordTab[]
            }
            actions={
              token.superAdmin || token.partner ? (
                <OrganisationActions
                  organisationId={organisation.id}
                  name={organisation.name}
                  webAddress={organisation.webAddress}
                  isSuperAdmin={token.superAdmin}
                  currentPartnerId={organisation.partnerId ?? null}
                />
              ) : undefined
            }
          >
            <TabsContent value="about">
              <Container>
                <AboutTab
                  organisationId={organisation.id}
                  about={organisation.about ?? null}
                />
              </Container>
            </TabsContent>
            <TabsContent value="logo">
              <Container>
                <LogoTab
                  organisationId={organisation.id}
                  logoFileExtension={organisation.logoFileExtension ?? null}
                  showLogoOnColour={organisation.showLogoOnColour ?? null}
                  primaryColour={organisation.primaryColour ?? null}
                />
              </Container>
            </TabsContent>
            <TabsContent value="adminUsers">
              <Container>
                <AdminUsersTable organisationId={organisation.id} />
              </Container>
            </TabsContent>
            <TabsContent value="chatUsers">
              <Container>
                <ChatUsersTable organisationId={organisation.id} />
              </Container>
            </TabsContent>
            <TabsContent value="agents">
              <Container>
                <AgentsTable organisationId={organisation.id} />
              </Container>
            </TabsContent>
            {showPartnerTabs ? (
              <TabsContent value="partnerDetails">
                <Container>
                  <EditPartnerDetailsForm
                    partnerId={organisation.id}
                    name={organisation.name}
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerDomains">
                <Container>
                  <EditPartnerDomainsForm
                    partnerId={organisation.id}
                    domain={organisation.domain ?? undefined}
                    coreDomain={organisation.coreDomain ?? undefined}
                    sendEmailFromDomain={
                      organisation.sendEmailFromDomain ?? undefined
                    }
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerApiKey">
                <Container>
                  <EditPartnerApiKeysForm
                    partnerId={organisation.id}
                    providerApiKeyId={
                      organisation.providerApiKeyId ?? undefined
                    }
                    providerApiKeyLabel={providerApiKeyLabel}
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerPrototyping">
                <Container>
                  <EditPartnerPrototypingForm
                    partnerId={organisation.id}
                    prototypingAgentId={organisation.prototypingAgentId}
                    prototypingAgentLabel={prototypingAgentLabel}
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerSalesAgent">
                <Container>
                  <EditPartnerSalesAgentForm
                    partnerId={organisation.id}
                    salesBotAgentId={organisation.salesBotAgentId}
                    salesBotAgentLabel={salesBotAgentLabel}
                    salesBotName={organisation.salesBotName ?? undefined}
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerPricing">
                <Container>
                  <EditPartnerPricingForm
                    partnerId={organisation.id}
                    hourlyRate={organisation.hourlyRate}
                    monthlyBaseFee={organisation.monthlyBaseFee}
                    monthlyPerIntegration={organisation.monthlyPerIntegration}
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerGoCardless">
                <Container>
                  <EditPartnerGoCardlessForm
                    partnerId={organisation.id}
                    goCardlessMandateLink={
                      organisation.goCardlessMandateLink ?? undefined
                    }
                  />
                </Container>
              </TabsContent>
            ) : null}
            {showPartnerTabs ? (
              <TabsContent value="partnerContactLegal">
                <Container>
                  <EditPartnerContactLegalForm
                    partnerId={organisation.id}
                    salesEmail={organisation.salesEmail ?? undefined}
                    accountsEmail={organisation.accountsEmail ?? undefined}
                    legalName={organisation.legalName ?? undefined}
                    companyNumber={organisation.companyNumber ?? undefined}
                    registeredAddress={
                      organisation.registeredAddress ?? undefined
                    }
                    legalEmail={organisation.legalEmail ?? undefined}
                  />
                </Container>
              </TabsContent>
            ) : null}
            {token.superAdmin || token.partner ? (
              <TabsContent value="providerApiKeys">
                <Container>
                  <ProviderApiKeysTable organisationId={organisation.id} />
                </Container>
              </TabsContent>
            ) : null}
            {token.superAdmin || token.partner ? (
              <TabsContent value="quotes">
                <Container>
                  {!organisation.partner ? (
                    <div className="flex justify-end mb-4">
                      <NewQuoteButton organisationId={organisation.id} />
                    </div>
                  ) : null}
                  <QuotesTable
                    organisationId={
                      organisation.partner ? undefined : organisation.id
                    }
                    partnerId={
                      organisation.partner ? organisation.id : undefined
                    }
                  />
                </Container>
              </TabsContent>
            ) : null}
          </RecordTabs>
        </>
      )}
      {!organisation && <NewOrganisationForm />}
    </Container>
  );
}
