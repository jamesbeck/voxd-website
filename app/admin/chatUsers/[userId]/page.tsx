import getUserById from "@/lib/getChatUserById";
import H1 from "@/components/adminui/H1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SessionsTable from "./sessionsTable";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { User } from "@/types/types";
import NewUserForm from "./newUserForm";
import { notFound } from "next/navigation";
import UserActions from "./UserActions";
import EditUserForm from "./editUserForm";
import H2 from "@/components/adminui/H2";
import getAgents from "@/lib/getAgents";
import getPartners from "@/lib/getPartners";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page({ params }: { params: { userId: string } }) {
  const token = await verifyAccessToken();

  const userId = (await params).userId;

  let user: User | null = null;

  if (userId && userId != "new") user = await getUserById({ userId: userId });

  if (!user && userId !== "new") return notFound();

  //get all agents for the edit form
  const agents = await getAgents();

  //get all partners for the edit form
  const partners = await getPartners();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user?.name || "New User" },
        ]}
      />
      <H1>{user?.name || "New User"}</H1>
      {user && (
        <>
          <Tabs defaultValue="sessions" className="space-y-2">
            <div className="flex items-center justify-between gap-4 mb-2">
              <TabsList>
                <TabsTrigger value="edit">Edit User</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>

              <UserActions user={user} />
            </div>
            <TabsContent value="edit">
              <EditUserForm
                userId={userId}
                name={user.name}
                email={user.email}
                number={user.number}
                partnerId={user.partnerId}
                testingAgentId={user.testingAgentId}
                organisationIds={user.organisationIds}
                agentOptions={agents.map((agent) => ({
                  value: agent.id,
                  label: agent.niceName,
                }))}
                partnerOptions={partners.map((partner) => ({
                  value: partner.id,
                  label: partner.name,
                }))}
              />
            </TabsContent>
            <TabsContent value="sessions">
              <H2>Sessions</H2>
              <SessionsTable userId={userId} admin={!!token.admin} />
            </TabsContent>
          </Tabs>
        </>
      )}
      {!user && <NewUserForm />}
    </Container>
  );
}
