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
import { notFound } from "next/navigation";
import SendMessageForm from "./sendMessageForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import H2 from "@/components/adminui/H2";
import { Spinner } from "@/components/ui/spinner";
import Conversation from "./conversation";
import SessionActions from "./sessionActions";
import WorkerRunsTable from "./workerRunsTable";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Activity,
  DollarSign,
  MessageSquare,
  Zap,
  ChevronLeft,
} from "lucide-react";

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

      <Tabs value={activeTab} className="space-y-2">
        <div className="flex items-center justify-between gap-4 mb-2">
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

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/agents/${agent.id}?tab=sessions`}>
                <ChevronLeft className="h-4 w-4" />
                Back to Agent
              </Link>
            </Button>

            <SessionActions
              sessionId={sessionId}
              name={session.id}
              agentId={agent.id}
              paused={session.paused}
              closed={!!session.closedAt}
            />
          </div>
        </div>
        <TabsContent value="conversation">
          <Container>
            <Conversation messages={messages} sessionId={sessionId} />
          </Container>
        </TabsContent>
        <TabsContent value="info">
          <Container>
            <DataCard
              items={
                [
                  {
                    label: "Conversation Start Date",
                    value: format(session.createdAt, "dd/MM/yyyy HH:mm:ss"),
                    description: formatDistance(session.createdAt, new Date(), {
                      addSuffix: true,
                    }),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                  {
                    label: "Last Message Date",
                    value: session.lastUserMessageDate
                      ? format(
                          session.lastUserMessageDate,
                          "dd/MM/yyyy HH:mm:ss"
                        )
                      : "No messages yet",
                    description: session.lastUserMessageDate
                      ? formatDistance(
                          session.lastUserMessageDate,
                          new Date(),
                          {
                            addSuffix: true,
                          }
                        )
                      : undefined,
                    icon: <Clock className="h-4 w-4" />,
                  },
                  {
                    label: "Session Status",
                    value: sessionStatus,
                    icon: <Activity className="h-4 w-4" />,
                    variant: session.closedAt
                      ? "danger"
                      : session.paused
                      ? "warning"
                      : "success",
                  },
                  session.closedReason
                    ? {
                        label: "Close Reason",
                        value: session.closedReason,
                        icon: <Activity className="h-4 w-4" />,
                      }
                    : null,
                  {
                    label: "Total Messages",
                    value: messages.length.toString(),
                    icon: <MessageSquare className="h-4 w-4" />,
                  },
                  {
                    label: "Approx. Prompt Cost",
                    value: `$${session.totalPromptCost.toFixed(4)}`,
                    description: `${session.totalPromptTokens.toLocaleString()} tokens`,
                    icon: <Zap className="h-4 w-4" />,
                  },
                  {
                    label: "Approx. Response Cost",
                    value: `$${session.totalCompletionCost.toFixed(4)}`,
                    description: `${session.totalCompletionTokens.toLocaleString()} tokens`,
                    icon: <Zap className="h-4 w-4" />,
                  },
                  {
                    label: "Approx. Total Cost",
                    value: `$${(
                      session.totalPromptCost + session.totalCompletionCost
                    ).toFixed(4)}`,
                    description: `${(
                      session.totalPromptTokens + session.totalCompletionTokens
                    ).toLocaleString()} total tokens`,
                    icon: <DollarSign className="h-4 w-4" />,
                  },
                ].filter(Boolean) as DataItem[]
              }
            />
          </Container>
        </TabsContent>
        <TabsContent value="workers">
          <Container>
            <WorkerRunsTable sessionId={sessionId} />
          </Container>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
