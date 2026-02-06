import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <Tabs defaultValue="agents" className="space-y-2">
            <div className="flex items-center justify-between gap-4 mb-2">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="adminUsers">Admin Users</TabsTrigger>
                <TabsTrigger value="chatUsers">Chat Users</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
                {token.superAdmin || token.partner ? (
                  <TabsTrigger value="quotes">Quotes</TabsTrigger>
                ) : null}
              </TabsList>

              {(token.superAdmin || token.partner) && (
                <OrganisationActions
                  organisationId={organisation.id}
                  name={organisation.name}
                  webAddress={organisation.webAddress}
                />
              )}
            </div>

            <div className="border-b mb-6" />

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
                  logoDarkBackground={organisation.logoDarkBackground ?? false}
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
              <TabsContent value="quotes">
                <Container>
                  <div className="flex justify-end mb-4">
                    <NewQuoteButton organisationId={organisation.id} />
                  </div>
                  <QuotesTable
                    organisationId={organisation.id}
                  />
                </Container>
              </TabsContent>
            ) : null}
          </Tabs>
        </>
      )}
      {!organisation && <NewOrganisationForm />}
    </Container>
  );
}
