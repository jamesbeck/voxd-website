import SessionsTable from "./sessionsTable";
import getAgentById from "@/lib/getAgentById";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H2 from "@/components/adminui/H2";
import { notFound } from "next/navigation";
import NewAgentForm from "./newAgentForm";
import AgentActions from "./agentActions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import UsersTable from "./usersTable";
import userCanViewAgent from "@/lib/userCanViewAgent";

export default async function Page({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = (await params).agentId;

  let agent;

  if (agentId && agentId != "new")
    agent = await getAgentById({ agentId: agentId });

  if (!agent && agentId !== "new") return notFound();

  //get the user
  const token = await verifyAccessToken();

  //can the user view this agent?
  if (!(await userCanViewAgent({ userId: token.userId, agentId: agentId! }))) {
    return notFound();
  }

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Agents", href: "/admin/agents" },
          { label: agent?.niceName || "New Agent" },
        ]}
      />
      <H1>{agent?.niceName || "New Agent"}</H1>
      {!!token.admin && (
        <AgentActions agentId={agentId} name={agent?.name || ""} />
      )}
      {agent && (
        <>
          <Tabs defaultValue="sessions" className="space-y-2">
            <TabsList>
              {!!token.admin && (
                <TabsTrigger value="edit">Edit Agent</TabsTrigger>
              )}
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            {!!token.admin && (
              <TabsContent value="edit">
                <Container>
                  <H2>Edit Agent</H2>
                </Container>
              </TabsContent>
            )}
            <TabsContent value="sessions">
              <Container>
                <H2>Sessions</H2>
                <SessionsTable agentId={agentId} />
              </Container>
            </TabsContent>
            <TabsContent value="users">
              <Container>
                <H2>Users</H2>
                <p>Users associated with this agent will be listed here.</p>
                <UsersTable agentId={agentId} />
              </Container>
            </TabsContent>
          </Tabs>
        </>
      )}
      {!agent && <NewAgentForm />}
    </Container>
  );
}
