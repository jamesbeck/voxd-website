import getMessages from "@/lib/getMessagesBySession";
import getConversations from "@/lib/getConversations";
import Link from "next/link";
import ConversationsTable from "./sessionsTable";
import { Button } from "@/components/ui/button";
import getAgentById from "@/lib/getAgentById";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import H1 from "@/components/adminui/h1";
import getSessions from "@/lib/getSessionsByAgent";

export default async function Page({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = (await params).agentId;

  const agent = await getAgentById({ agentId: agentId });

  const sessions = await getSessions({ agentId: agentId });

  //   const messages = await getMessages({ agentId: agentId });
  // const conversations = await getConversations({ agentId: agentId });

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/agents">Agents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{agent.niceName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <H1>{agent.niceName} Agent</H1>
      <ConversationsTable sessions={sessions} agentId={agentId} />
    </div>
  );
}
