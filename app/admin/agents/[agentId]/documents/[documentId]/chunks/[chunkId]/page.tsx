import getChunkById from "@/lib/getChunkById";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { notFound } from "next/navigation";
import userCanViewAgent from "@/lib/userCanViewAgent";
import EditChunkForm from "./editChunkForm";
import ChunkActions from "./chunkActions";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import {
  FileText,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H2 from "@/components/adminui/H2";
import Link from "next/link";

export default async function Page({
  params,
  searchParams,
}: {
  params: { agentId: string; documentId: string; chunkId: string };
  searchParams: { tab?: string };
}) {
  const { agentId, documentId, chunkId } = await params;
  const activeTab = (await searchParams).tab || "info";

  const chunk = await getChunkById({ chunkId });

  if (!chunk) return notFound();

  // Verify the user can view this agent
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
            label: chunk.agentNiceName || "Agent",
            href: `/admin/agents/${agentId}`,
          },
          {
            label: "Knowledge",
            href: `/admin/agents/${agentId}?tab=knowledge`,
          },
          {
            label: chunk.documentTitle || "Document",
            href: `/admin/agents/${agentId}/documents/${documentId}`,
          },
          {
            label: "Chunks",
            href: `/admin/agents/${agentId}/documents/${documentId}?tab=chunks`,
          },
          { label: `Chunk ${chunk.chunkIndex}` },
        ]}
      />
      <H1>Chunk {chunk.chunkIndex}</H1>

      <Tabs value={activeTab} className="space-y-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="info" asChild>
              <Link
                href={`/admin/agents/${agentId}/documents/${documentId}/chunks/${chunkId}?tab=info`}
              >
                Info
              </Link>
            </TabsTrigger>
            <TabsTrigger value="edit" asChild>
              <Link
                href={`/admin/agents/${agentId}/documents/${documentId}/chunks/${chunkId}?tab=edit`}
              >
                Edit
              </Link>
            </TabsTrigger>
          </TabsList>
          <ChunkActions
            chunkId={chunkId}
            chunkIndex={chunk.chunkIndex}
            agentId={agentId}
            documentId={documentId}
          />
        </div>

        <div className="border-b mb-6" />

        <TabsContent value="info">
          <Container>
            <DataCard
              items={
                [
                  {
                    label: "Chunk Index",
                    value: chunk.chunkIndex,
                    icon: <Hash className="h-4 w-4" />,
                  },
                  chunk.title
                    ? {
                        label: "Title",
                        value: chunk.title,
                        icon: <Layers className="h-4 w-4" />,
                      }
                    : null,
                  {
                    label: "Token Count",
                    value: chunk.tokenCount || "N/A",
                    icon: <FileText className="h-4 w-4" />,
                  },
                  {
                    label: "Has Embedding",
                    value: chunk.hasEmbedding ? "Yes" : "No",
                    icon: chunk.hasEmbedding ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ),
                  },
                  {
                    label: "Created",
                    value: format(
                      new Date(chunk.createdAt),
                      "dd/MM/yyyy HH:mm"
                    ),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                ].filter(Boolean) as DataItem[]
              }
            />
            <div className="mt-6">
              <H2>Content</H2>
              <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-sm">
                {chunk.content}
              </div>
            </div>
          </Container>
        </TabsContent>

        <TabsContent value="edit">
          <Container>
            <H2>Edit Chunk</H2>
            <p className="text-muted-foreground mb-4">
              Editing the content will regenerate the embedding.
            </p>
            <EditChunkForm
              chunkId={chunkId}
              documentId={documentId}
              agentId={agentId}
              content={chunk.content}
              title={chunk.title}
            />
          </Container>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
