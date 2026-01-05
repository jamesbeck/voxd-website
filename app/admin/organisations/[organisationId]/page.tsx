import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H1 from "@/components/adminui/H1";
import getOrganisationById from "@/lib/getOrganisationById";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import H2 from "@/components/adminui/H2";
import EditOrganisationForm from "./editOrganisationForm";
import { notFound } from "next/navigation";
import AgentsTable from "./agentsTable";
import NewOrganisationForm from "./newOrganisationForm";
import AdminUsersTable from "./adminUsersTable";
import ChatUsersTable from "./chatUsersTable";
import QuotesTable from "./quotesTable";

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
            <TabsList>
              <TabsTrigger value="edit">Edit Organisation</TabsTrigger>
              <TabsTrigger value="adminUsers">Admin Users</TabsTrigger>
              <TabsTrigger value="chatUsers">Chat Users</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              {token.admin || token.partner ? (
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
              ) : null}
            </TabsList>

            <div className="border-b mb-6" />

            <TabsContent value="edit">
              <EditOrganisationForm
                organisationId={organisation.id}
                name={organisation.name}
                partnerId={organisation.partnerId}
                adminUserIds={organisation.adminUserIds}
                isAdmin={token.admin}
              />
            </TabsContent>
            <TabsContent value="adminUsers">
              <Container>
                <H2>Admin Users</H2>
                <AdminUsersTable organisationId={organisation.id} />
              </Container>
            </TabsContent>
            <TabsContent value="chatUsers">
              <Container>
                <H2>Chat Users</H2>
                <ChatUsersTable organisationId={organisation.id} />
              </Container>
            </TabsContent>
            <TabsContent value="agents">
              <Container>
                <H2>Agents</H2>
                <AgentsTable organisationId={organisation.id} />
              </Container>
            </TabsContent>
            {token.admin || token.partner ? (
              <TabsContent value="quotes">
                <Container>
                  <H2>Quotes</H2>
                  <QuotesTable organisationId={organisation.id} />
                </Container>
              </TabsContent>
            ) : null}
          </Tabs>
        </>
      )}
      {!organisation && <NewOrganisationForm isAdmin={token.admin} />}
    </Container>
  );
}
