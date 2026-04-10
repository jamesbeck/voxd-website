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
}: {
  params: { organisationId: string };
}) {
  const token = await verifyAccessToken();

  const organisationId = (await params).organisationId;

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
            defaultValue="agents"
            tabs={
              [
                { value: "about", label: "About" },
                { value: "logo", label: "Logo & Branding" },
                { value: "adminUsers", label: "Admin Users" },
                { value: "chatUsers", label: "Chat Users" },
                { value: "agents", label: "Agents" },
                ...(token.superAdmin || token.partner
                  ? [
                      { value: "providerApiKeys", label: "API Keys" },
                      { value: "quotes", label: "Quotes" },
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
