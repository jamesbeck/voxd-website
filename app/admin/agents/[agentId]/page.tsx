import SessionsTable from "./sessionsTable";
import getAgentById from "@/lib/getAgentById";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
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
import Link from "next/link";
import Dashboard from "./dashboard";
import { Card, CardContent } from "@/components/ui/card";
import EditAgentForm from "./editAgentForm";

export default async function Page({
  params,
  searchParams,
}: {
  params: { agentId: string };
  searchParams: { tab?: string };
}) {
  const agentId = (await params).agentId;
  const activeTab = (await searchParams).tab || "dashboard";

  let agent;

  if (agentId && agentId != "new")
    agent = await getAgentById({ agentId: agentId });

  if (!agent && agentId !== "new") return notFound();

  //get the user
  const token = await verifyAccessToken();

  //can the user view this agent?
  if (!(await userCanViewAgent({ agentId: agentId! }))) {
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
          <Card>
            <CardContent>
              <div>
                <b>Model:</b> {agent?.provider} / {agent?.model}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} className="space-y-2">
            <TabsList>
              <TabsTrigger value="dashboard" asChild>
                <Link href={`/admin/agents/${agentId}?tab=dashboard`}>
                  Dashboard
                </Link>
              </TabsTrigger>
              {!!token.admin && (
                <TabsTrigger value="edit" asChild>
                  <Link href={`/admin/agents/${agentId}?tab=edit`}>
                    Edit Agent
                  </Link>
                </TabsTrigger>
              )}
              <TabsTrigger value="sessions" asChild>
                <Link href={`/admin/agents/${agentId}?tab=sessions`}>
                  Sessions
                </Link>
              </TabsTrigger>
              <TabsTrigger value="users" asChild>
                <Link href={`/admin/agents/${agentId}?tab=users`}>Users</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <Container>
                <H2>Dashboard</H2>
                <Dashboard agentId={agentId} />
              </Container>
            </TabsContent>
            {!!token.admin && (
              <TabsContent value="edit">
                <Container>
                  <H2>Edit Agent</H2>
                  <EditAgentForm
                    agentId={agentId}
                    name={agent?.name}
                    niceName={agent?.niceName}
                    openAiApiKey={agent?.openAiApiKey}
                  />
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
                <H2>Chat Users</H2>
                <p>
                  Chat users that have ever interacted with this agent are
                  listed below.
                </p>
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
