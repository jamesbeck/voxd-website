import getPartialPromptById from "@/lib/getPartialPromptById";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H2 from "@/components/adminui/H2";
import { notFound } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import Link from "next/link";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import { FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import EditPartialPromptForm from "./editPartialPromptForm";
import PartialPromptActions from "./partialPromptActions";

export default async function Page({
  params,
  searchParams,
}: {
  params: { agentId: string; partialPromptId: string };
  searchParams: { tab?: string };
}) {
  const { agentId, partialPromptId } = await params;
  const activeTab = (await searchParams).tab || "info";

  const partialPrompt = await getPartialPromptById({ partialPromptId });

  if (!partialPrompt) return notFound();

  // Verify the user can view this agent
  const token = await verifyAccessToken();
  if (!(await userCanViewAgent({ agentId }))) {
    return notFound();
  }

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Agents", href: "/admin/agents" },
          {
            label: partialPrompt.agentNiceName || "Agent",
            href: `/admin/agents/${agentId}`,
          },
          {
            label: "Partial Prompts",
            href: `/admin/agents/${agentId}?tab=partial-prompts`,
          },
          { label: partialPrompt.name },
        ]}
      />
      <H1>{partialPrompt.name}</H1>

      <Tabs value={activeTab} className="space-y-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="info" asChild>
              <Link
                href={`/admin/agents/${agentId}/partial-prompts/${partialPromptId}?tab=info`}
              >
                Info
              </Link>
            </TabsTrigger>
            <TabsTrigger value="edit" asChild>
              <Link
                href={`/admin/agents/${agentId}/partial-prompts/${partialPromptId}?tab=edit`}
              >
                Edit
              </Link>
            </TabsTrigger>
          </TabsList>
          {!!token.admin && (
            <PartialPromptActions
              partialPromptId={partialPromptId}
              partialPromptName={partialPrompt.name}
              agentId={agentId}
            />
          )}
        </div>

        <div className="border-b mb-6" />

        <TabsContent value="info">
          <Container>
            <DataCard
              items={
                [
                  {
                    label: "Name",
                    value: partialPrompt.name,
                    icon: <FileText className="h-4 w-4" />,
                  },
                  {
                    label: "Created",
                    value: format(
                      new Date(partialPrompt.createdAt),
                      "dd/MM/yyyy HH:mm"
                    ),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                  {
                    label: "Updated",
                    value: format(
                      new Date(partialPrompt.updatedAt),
                      "dd/MM/yyyy HH:mm"
                    ),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                ].filter(Boolean) as DataItem[]
              }
            />
            <div className="mt-6">
              <H2>Text</H2>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                {partialPrompt.text}
              </div>
            </div>
          </Container>
        </TabsContent>

        <TabsContent value="edit">
          <Container>
            <H2>Edit Partial Prompt</H2>
            <EditPartialPromptForm
              partialPromptId={partialPromptId}
              agentId={agentId}
              name={partialPrompt.name}
              text={partialPrompt.text}
            />
          </Container>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
