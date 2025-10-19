import SessionsTable from "./sessionsTable";
import getAgentById from "@/lib/getAgentById";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H2 from "@/components/adminui/H2";
import { notFound } from "next/navigation";
import NewAgentForm from "./newAgentForm";
import AgentActions from "./agentActions";

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
      <AgentActions agentId={agentId} name={agent?.name || ""} />
      {agent && (
        <>
          <Tabs defaultValue="sessions" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit Agent</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Container>
                <H2>Edit Agent</H2>
              </Container>
            </TabsContent>
            <TabsContent value="sessions">
              <Container>
                <H2>Sessions</H2>
                <SessionsTable agentId={agentId} />
              </Container>
            </TabsContent>
          </Tabs>
        </>
      )}
      {!agent && <NewAgentForm />}
    </Container>
  );
}
