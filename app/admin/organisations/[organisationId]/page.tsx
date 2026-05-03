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

  // Authorization check: user must be super admin, partner of this org, or belong to the organisation
  if (organisation) {
    const isSuperAdmin = token.superAdmin;
    const isPartnerOfOrg =
      token.partnerId && organisation.partnerId === token.partnerId;
    const isMemberOfOrg = token.organisationId === organisation.id;

    if (!isSuperAdmin && !isPartnerOfOrg && !isMemberOfOrg) {
      return notFound();
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
                  <div className="flex justify-end mb-4">
                    <NewQuoteButton organisationId={organisation.id} />
                  </div>
                  <QuotesTable organisationId={organisation.id} />
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
