import getMessages from "@/lib/getMessagesBySession";
import getAgentById from "@/lib/getAgentById";
import getUserById from "@/lib/getChatUserById";
import {
  differenceInMilliseconds,
  differenceInSeconds,
  format,
  formatDistance,
  addSeconds,
} from "date-fns";
import getSessionById from "@/lib/getSessionById";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import SendMessageForm from "./sendMessageForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import H2 from "@/components/adminui/H2";
import { Spinner } from "@/components/ui/spinner";
import Conversation from "./conversation";
import SessionActions from "./sessionActions";

export default async function Page({
  searchParams,
  params,
}: {
  params: { sessionId: string };
  searchParams: { tab?: string };
}) {
  const activeTab = (await searchParams).tab || "conversation";

  const accessToken = await verifyAccessToken();

  const awaitedParams = await params;

  const sessionId = awaitedParams.sessionId;

  const session = await getSessionById({ sessionId: sessionId });

  if (!session) notFound();

  const user = await getUserById({ userId: session.userId });
  const agent = await getAgentById({ agentId: session.agentId });

  let sessionStatus = "Active";
  if (!!session.closedAt) sessionStatus = "Closed";
  else if (session.paused) sessionStatus = "Paused";

  if (session.lastUserMessageDate && !session.closedAt) {
    const sessionExpiresAt = addSeconds(
      session.lastUserMessageDate,
      agent.autoCloseSessionAfterSecs
    );
  }

  const messages = await getMessages({ sessionId: sessionId });

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Agents", href: "/admin/agents" },
          { label: agent.niceName, href: `/admin/agents/${agent.id}` },
          { label: session.id },
        ]}
      />

      <H1 className="text-2xl font-semibold mb-4">
        {user.name} ({user.number}) & {agent.niceName}
      </H1>

      <SessionActions
        sessionId={sessionId}
        name={session.id}
        agentId={agent.id}
        paused={session.paused}
      />

      <Tabs value={activeTab} className="space-y-2">
        <TabsList>
          <TabsTrigger value="conversation" asChild>
            <Link href={`/admin/sessions/${sessionId}?tab=conversation`}>
              Conversation
            </Link>
          </TabsTrigger>

          <TabsTrigger value="info" asChild>
            <Link href={`/admin/sessions/${sessionId}?tab=info`}>Info</Link>
          </TabsTrigger>
          <TabsTrigger value="workers" asChild>
            <Link href={`/admin/sessions/${sessionId}?tab=workers`}>
              Workers
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="conversation">
          <Container>
            <H2>Conversation</H2>
            <Conversation messages={messages} sessionId={sessionId} />
          </Container>
        </TabsContent>
        <TabsContent value="info">
          <Container>
            <H2>Info</H2>
            <Card>
              <CardContent>
                <table>
                  <tbody>
                    <tr>
                      <td className="font-bold pr-4">
                        Conversation Start Date:
                      </td>
                      <td>
                        {format(session.createdAt, "dd/MM/yyyy HH:mm:ss")} (
                        {formatDistance(session.createdAt, new Date())})
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4">Last Message Date:</td>
                      <td>
                        {session.lastUserMessageDate
                          ? format(
                              session.lastUserMessageDate,
                              "dd/MM/yyyy HH:mm:ss"
                            ) +
                            ` (${formatDistance(
                              session.lastUserMessageDate,
                              new Date()
                            )})`
                          : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4">Session Status:</td>
                      <td>{session.paused ? "Paused" : "Active"}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4">Approx. Prompt Cost:</td>
                      <td>
                        ${session.totalPromptCost.toFixed(4)} (
                        {session.totalPromptTokens} tokens)
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4">Approx. Response Cost:</td>
                      <td>
                        ${session.totalCompletionCost.toFixed(4)} (
                        {session.totalCompletionTokens} tokens)
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4">Approx. Total Cost</td>
                      <td>
                        $
                        {(
                          session.totalPromptCost + session.totalCompletionCost
                        ).toFixed(4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </Container>
        </TabsContent>
        <TabsContent value="workers">
          <Container>
            <H2>Workers</H2>
          </Container>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
