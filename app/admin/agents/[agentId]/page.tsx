import SessionsTable from "./sessionsTable";
import getAgentById from "@/lib/getAgentById";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs, { RecordTab } from "@/components/admin/RecordTabs";
import H2 from "@/components/adminui/H2";
import { notFound } from "next/navigation";
import NewAgentForm from "./newAgentForm";
import AgentActions from "./agentActions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import UsersTable from "./usersTable";
import userCanViewAgent from "@/lib/userCanViewAgent";
import Link from "next/link";
import Dashboard from "./dashboard";
import EditAgentForm from "./editAgentForm";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import DocumentsCards from "./documentsCards";
import NewDocumentForm from "./newDocumentForm";
import PartialPromptsTable from "./partialPromptsTable";
import NewPartialPromptForm from "./newPartialPromptForm";
import TemplatesSentTable from "./templatesSentTable";
import { Button } from "@/components/ui/button";
import saGetTicketsByAgentId from "@/actions/saGetTicketsByAgentId";
import {
  Bot,
  Cpu,
  Phone,
  Building2,
  MessageSquare,
  History,
  Clock,
  BookOpen,
  FileText,
} from "lucide-react";
import ModelTab from "./modelTab";
import JsonConfigEditor from "./JsonConfigEditor";

export default async function Page({
  params,
  searchParams,
}: {
  params: { agentId: string };
  searchParams: { tab?: string };
}) {
  const agentId = (await params).agentId;
  const activeTab = (await searchParams).tab || "info";

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

  // Fetch tickets for this agent
  const ticketsResponse = await saGetTicketsByAgentId({ agentId });
  const tickets = ticketsResponse.success ? ticketsResponse.data : [];

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
      {agent && (
        <>
          <RecordTabs
            value={activeTab}
            tabs={
              [
                {
                  value: "info",
                  label: "Info",
                  href: `/admin/agents/${agentId}?tab=info`,
                },
                {
                  value: "dashboard",
                  label: "Dashboard",
                  href: `/admin/agents/${agentId}?tab=dashboard`,
                },
                ...(token.superAdmin
                  ? [
                      {
                        value: "edit",
                        label: "Edit Agent",
                        href: `/admin/agents/${agentId}?tab=edit`,
                      },
                    ]
                  : []),
                {
                  value: "model",
                  label: "Model",
                  href: `/admin/agents/${agentId}?tab=model`,
                },
                {
                  value: "sessions",
                  label: "Sessions",
                  href: `/admin/agents/${agentId}?tab=sessions`,
                },
                {
                  value: "users",
                  label: "Users",
                  href: `/admin/agents/${agentId}?tab=users`,
                },
                {
                  value: "templates-sent",
                  label: "Templates Sent",
                  href: `/admin/agents/${agentId}?tab=templates-sent`,
                },
                {
                  value: "knowledge",
                  label: "Knowledge",
                  href: `/admin/agents/${agentId}?tab=knowledge`,
                },
                {
                  value: "partial-prompts",
                  label: "Partial Prompts",
                  href: `/admin/agents/${agentId}?tab=partial-prompts`,
                },
                ...(token.superAdmin
                  ? [
                      {
                        value: "config",
                        label: "Config",
                        href: `/admin/agents/${agentId}?tab=config`,
                      },
                    ]
                  : []),
              ] satisfies RecordTab[]
            }
            actions={
              <AgentActions
                agentId={agentId}
                name={agent?.name || ""}
                niceName={agent?.niceName || ""}
                phoneNumber={agent?.phoneNumber || ""}
                organisationId={agent?.organisationId || ""}
                tickets={tickets || []}
                isSuperAdmin={!!token.superAdmin}
              />
            }
          >
            <TabsContent value="info">
              <Container>
                <DataCard
                  items={
                    [
                      {
                        label: "Agent Name",
                        value: agent.name,
                        icon: <Bot className="h-4 w-4" />,
                      },
                      {
                        label: "Model",
                        value: `${agent.provider} / ${agent.model}`,
                        icon: <Cpu className="h-4 w-4" />,
                      },
                      agent.displayPhoneNumber
                        ? {
                            label: "Phone Number",
                            value: agent.displayPhoneNumber,
                            icon: <Phone className="h-4 w-4" />,
                          }
                        : null,
                      agent.organisationName
                        ? {
                            label: "Organisation",
                            value: agent.organisationName,
                            icon: <Building2 className="h-4 w-4" />,
                          }
                        : null,
                      agent.targetMessageLengthCharacters
                        ? {
                            label: "Target Message Length",
                            value: `${agent.targetMessageLengthCharacters} characters`,
                            icon: <MessageSquare className="h-4 w-4" />,
                          }
                        : null,
                      agent.maxMessageHistory
                        ? {
                            label: "Max Message History",
                            value: agent.maxMessageHistory,
                            icon: <History className="h-4 w-4" />,
                          }
                        : null,
                      agent.autoCloseSessionAfterSeconds
                        ? {
                            label: "Auto Close Session After",
                            value: `${agent.autoCloseSessionAfterSeconds} seconds`,
                            icon: <Clock className="h-4 w-4" />,
                          }
                        : null,
                    ].filter(Boolean) as DataItem[]
                  }
                />
              </Container>
            </TabsContent>
            <TabsContent value="dashboard">
              <Container>
                <H2>Dashboard</H2>
                <Dashboard agentId={agentId} />
              </Container>
            </TabsContent>
            {!!token.superAdmin && (
              <TabsContent value="edit">
                <Container>
                  <H2>Edit Agent</H2>
                  <EditAgentForm
                    agentId={agentId}
                    name={agent?.name}
                    niceName={agent?.niceName}
                    openAiApiKey={agent?.openAiApiKey}
                    organisationId={agent?.organisationId}
                    organisationName={agent?.organisationName}
                    phoneNumberId={agent?.phoneNumberId}
                    phoneNumberDisplay={
                      agent?.displayPhoneNumber && agent?.verifiedName
                        ? `${agent.displayPhoneNumber} ${agent.verifiedName}`
                        : agent?.displayPhoneNumber
                    }
                    codeDirectory={agent?.codeDirectory}
                    targetMessageLengthCharacters={
                      agent?.targetMessageLengthCharacters
                    }
                    maxMessageHistory={agent?.maxMessageHistory}
                    autoCloseSessionAfterSeconds={
                      agent?.autoCloseSessionAfterSeconds
                    }
                  />
                </Container>
              </TabsContent>
            )}
            <TabsContent value="model">
              <Container>
                <ModelTab
                  agentId={agentId}
                  currentModelId={agent?.modelId}
                  currentModelName={agent?.model}
                  currentModelProvider={agent?.provider}
                  currentInputTokenCost={agent?.inputTokenCost}
                  currentOutputTokenCost={agent?.outputTokenCost}
                />
              </Container>
            </TabsContent>
            <TabsContent value="sessions">
              <Container>
                <H2>Sessions</H2>
                <SessionsTable
                  agentId={agentId}
                  superAdmin={!!token.superAdmin}
                />
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
            <TabsContent value="templates-sent">
              <Container>
                <H2>Templates Sent</H2>
                <p className="text-muted-foreground mb-4">
                  Template messages sent to chat users of this agent.
                </p>
                <TemplatesSentTable agentId={agentId} />
              </Container>
            </TabsContent>
            <TabsContent value="knowledge">
              <Container>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <H2>Knowledge Documents</H2>
                    <p className="text-muted-foreground">
                      Manage knowledge documents that the agent can use to
                      answer questions.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/admin/agents/${agentId}?tab=new-document`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      New Document
                    </Link>
                  </Button>
                </div>
                <DocumentsCards agentId={agentId} />
              </Container>
            </TabsContent>
            <TabsContent value="new-document">
              <Container>
                <H2>New Knowledge Document</H2>
                <p className="text-muted-foreground mb-4">
                  Create a new knowledge document for this agent.
                </p>
                <NewDocumentForm agentId={agentId} />
              </Container>
            </TabsContent>
            <TabsContent value="partial-prompts">
              <Container>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <H2>Partial Prompts</H2>
                    <p className="text-muted-foreground">
                      Manage prompt snippets that can be included in the
                      agent&apos;s system prompt.
                    </p>
                  </div>
                  {!!token.superAdmin && (
                    <Button asChild>
                      <Link
                        href={`/admin/agents/${agentId}?tab=new-partial-prompt`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        New Partial Prompt
                      </Link>
                    </Button>
                  )}
                </div>
                <PartialPromptsTable agentId={agentId} />
              </Container>
            </TabsContent>
            {!!token.superAdmin && (
              <TabsContent value="new-partial-prompt">
                <Container>
                  <H2>New Partial Prompt</H2>
                  <p className="text-muted-foreground mb-4">
                    Create a new partial prompt for this agent.
                  </p>
                  <NewPartialPromptForm agentId={agentId} />
                </Container>
              </TabsContent>
            )}
            {!!token.superAdmin && (
              <TabsContent value="config">
                <Container>
                  <H2>Agent Config</H2>
                  {agent.config ? (
                    <JsonConfigEditor
                      agentId={agentId}
                      initialData={agent.config}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        No config stored for this agent.
                      </p>
                      <JsonConfigEditor agentId={agentId} initialData={{}} />
                    </div>
                  )}
                </Container>
              </TabsContent>
            )}
          </RecordTabs>
        </>
      )}
      {!agent && <NewAgentForm />}
    </Container>
  );
}
