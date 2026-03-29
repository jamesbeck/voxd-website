import getMessages from "@/lib/getMessagesBySession";
import getAgentById from "@/lib/getAgentById";
import getUserById from "@/lib/getChatUserById";
import saGetTicketsByMessageIds from "@/actions/saGetTicketsByMessageIds";
import saGetTicketsBySessionId from "@/actions/saGetTicketsBySessionId";
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
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs from "@/components/admin/RecordTabs";
import Link from "next/link";
import H2 from "@/components/adminui/H2";
import { Spinner } from "@/components/ui/spinner";
import Conversation from "./conversation";
import SessionActions from "./sessionActions";
import WorkerRunsTable from "./workerRunsTable";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import { Button } from "@/components/ui/button";
import SessionJsonDataEditor from "./SessionJsonDataEditor";
import {
  Calendar,
  Clock,
  Activity,
  DollarSign,
  MessageSquare,
  Zap,
  ChevronLeft,
  Monitor,
  User,
  Mail,
  Phone,
  Hash,
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
      agent.autoCloseSessionAfterSecs,
    );
  }

  const messages = await getMessages({ sessionId: sessionId });

  // Fetch open/in-progress tickets for messages
  const userMessageIds = messages
    .filter((m: any) => m.role === "user")
    .map((m: any) => m.id);
  const assistantMessageIds = messages
    .filter((m: any) => m.role === "assistant")
    .map((m: any) => m.id);

  const ticketsResult = await saGetTicketsByMessageIds({
    userMessageIds,
    assistantMessageIds,
  });
  const ticketsByMessage = ticketsResult.success ? ticketsResult.data : {};

  // Fetch tickets for this session
  const sessionTicketsResult = await saGetTicketsBySessionId({ sessionId });
  const sessionTickets = sessionTicketsResult.success
    ? sessionTicketsResult.data
    : [];

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
        {user.name || "Anonymous"} & {agent.niceName}
      </H1>

      <RecordTabs
        value={activeTab}
        tabs={[
          {
            value: "conversation",
            label: "Conversation",
            href: `/admin/sessions/${sessionId}?tab=conversation`,
          },
          {
            value: "info",
            label: "Info",
            href: `/admin/sessions/${sessionId}?tab=info`,
          },
          {
            value: "workers",
            label: "Workers",
            href: `/admin/sessions/${sessionId}?tab=workers`,
          },
          {
            value: "data",
            label: "Data",
            href: `/admin/sessions/${sessionId}?tab=data`,
          },
        ]}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/agents/${agent.id}?tab=sessions`}>
                <ChevronLeft className="h-4 w-4" />
                Back to Agent
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/chatUsers/${user.id}`}>View User</Link>
            </Button>

            <SessionActions
              sessionId={sessionId}
              name={session.id}
              agentId={agent.id}
              paused={session.paused}
              closed={!!session.closedAt}
              tickets={sessionTickets}
              messages={messages}
            />
          </>
        }
      >
        <TabsContent value="conversation">
          <Container>
            <Conversation
              messages={messages}
              sessionId={sessionId}
              agentId={agent.id}
              ticketsByMessage={ticketsByMessage || {}}
              paused={session.paused}
            />
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
                          "dd/MM/yyyy HH:mm:ss",
                        )
                      : "No messages yet",
                    description: session.lastUserMessageDate
                      ? formatDistance(
                          session.lastUserMessageDate,
                          new Date(),
                          {
                            addSuffix: true,
                          },
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
                  {
                    label: "Platform",
                    value: session.platform === "whatsapp" ? "WhatsApp" : "Web",
                    icon: <Monitor className="h-4 w-4" />,
                  },
                  session.closedReason
                    ? {
                        label: "Close Reason",
                        value: session.closedReason,
                        icon: <Activity className="h-4 w-4" />,
                      }
                    : null,
                  {
                    label: "User Name",
                    value: user.name || "Anonymous",
                    icon: <User className="h-4 w-4" />,
                  },
                  {
                    label: "User Email",
                    value: user.email || "Unknown",
                    icon: <Mail className="h-4 w-4" />,
                  },
                  {
                    label: "User Phone",
                    value: user.number || "Unknown",
                    icon: <Phone className="h-4 w-4" />,
                  },
                  user.externalId
                    ? {
                        label: "External ID",
                        value: user.externalId,
                        icon: <Hash className="h-4 w-4" />,
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
                    description: `${session.totalinputTokens.toLocaleString()} tokens`,
                    icon: <Zap className="h-4 w-4" />,
                  },
                  {
                    label: "Approx. Response Cost",
                    value: `$${session.totalCompletionCost.toFixed(4)}`,
                    description: `${session.totaloutputTokens.toLocaleString()} tokens`,
                    icon: <Zap className="h-4 w-4" />,
                  },
                  {
                    label: "Approx. Total Cost",
                    value: `$${(
                      session.totalPromptCost + session.totalCompletionCost
                    ).toFixed(4)}`,
                    description: `${(
                      session.totalinputTokens + session.totaloutputTokens
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
        <TabsContent value="data">
          <Container>
            <H2>Session Data</H2>
            {session.data ? (
              <SessionJsonDataEditor
                sessionId={sessionId}
                initialData={session.data}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  No data stored for this session.
                </p>
                <SessionJsonDataEditor sessionId={sessionId} initialData={{}} />
              </div>
            )}
          </Container>
        </TabsContent>
      </RecordTabs>
    </Container>
  );
}
