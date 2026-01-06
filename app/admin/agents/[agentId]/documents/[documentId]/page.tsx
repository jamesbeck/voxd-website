import getDocumentById from "@/lib/getDocumentById";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H2 from "@/components/adminui/H2";
import { notFound } from "next/navigation";
import userCanViewAgent from "@/lib/userCanViewAgent";
import Link from "next/link";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Link as LinkIcon,
  Calendar,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import EditDocumentForm from "./editDocumentForm";
import DocumentActions from "./documentActions";
import ChunksTable from "./chunksTable";
import NewChunkForm from "./newChunkForm";
import BulkImportForm from "./bulkImportForm";
import SmartImportForm from "./smartImportForm";

export default async function Page({
  params,
  searchParams,
}: {
  params: { agentId: string; documentId: string };
  searchParams: { tab?: string };
}) {
  const { agentId, documentId } = await params;
  const activeTab = (await searchParams).tab || "info";

  const document = await getDocumentById({ documentId });

  if (!document) return notFound();

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
            label: document.agentNiceName || "Agent",
            href: `/admin/agents/${agentId}`,
          },
          {
            label: "Knowledge",
            href: `/admin/agents/${agentId}?tab=knowledge`,
          },
          { label: document.title },
        ]}
      />
      <H1>{document.title}</H1>

      <Tabs value={activeTab} className="space-y-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="info" asChild>
              <Link
                href={`/admin/agents/${agentId}/documents/${documentId}?tab=info`}
              >
                Info
              </Link>
            </TabsTrigger>
            <TabsTrigger value="edit" asChild>
              <Link
                href={`/admin/agents/${agentId}/documents/${documentId}?tab=edit`}
              >
                Edit
              </Link>
            </TabsTrigger>
            <TabsTrigger value="chunks" asChild>
              <Link
                href={`/admin/agents/${agentId}/documents/${documentId}?tab=chunks`}
              >
                Chunks
              </Link>
            </TabsTrigger>
          </TabsList>
          <DocumentActions
            documentId={documentId}
            documentTitle={document.title}
            agentId={agentId}
          />
        </div>

        <div className="border-b mb-6" />

        <TabsContent value="info">
          <Container>
            <DataCard
              items={
                [
                  {
                    label: "Title",
                    value: document.title,
                    icon: <FileText className="h-4 w-4" />,
                  },
                  document.description
                    ? {
                        label: "Description",
                        value: document.description,
                        icon: <FileText className="h-4 w-4" />,
                      }
                    : null,
                  document.sourceType
                    ? {
                        label: "Source Type",
                        value: document.sourceType,
                        icon: <Layers className="h-4 w-4" />,
                      }
                    : null,
                  document.sourceUrl
                    ? {
                        label: "Source URL",
                        value: document.sourceUrl,
                        icon: <LinkIcon className="h-4 w-4" />,
                      }
                    : null,
                  {
                    label: "Enabled",
                    value: document.enabled ? "Yes" : "No",
                    icon: document.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ),
                  },
                  {
                    label: "Created",
                    value: format(
                      new Date(document.createdAt),
                      "dd/MM/yyyy HH:mm"
                    ),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                  {
                    label: "Updated",
                    value: format(
                      new Date(document.updatedAt),
                      "dd/MM/yyyy HH:mm"
                    ),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                ].filter(Boolean) as DataItem[]
              }
            />
          </Container>
        </TabsContent>

        <TabsContent value="edit">
          <Container>
            <H2>Edit Document</H2>
            <EditDocumentForm
              documentId={documentId}
              agentId={agentId}
              title={document.title}
              description={document.description}
              sourceUrl={document.sourceUrl}
              sourceType={document.sourceType}
              enabled={document.enabled}
            />
          </Container>
        </TabsContent>

        <TabsContent value="chunks">
          <Container>
            <div className="flex items-center justify-between mb-4">
              <div>
                <H2>Chunks</H2>
                <p className="text-muted-foreground">
                  Knowledge chunks are segments of the document used for
                  semantic search.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link
                    href={`/admin/agents/${agentId}/documents/${documentId}?tab=smart-import`}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Smart Import (AI)
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/admin/agents/${agentId}/documents/${documentId}?tab=bulk-import`}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/admin/agents/${agentId}/documents/${documentId}?tab=new-chunk`}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    New Chunk
                  </Link>
                </Button>
              </div>
            </div>
            <ChunksTable documentId={documentId} agentId={agentId} />
          </Container>
        </TabsContent>

        <TabsContent value="new-chunk">
          <Container>
            <H2>New Chunk</H2>
            <p className="text-muted-foreground mb-4">
              Create a new knowledge chunk. The embedding will be generated
              automatically.
            </p>
            <NewChunkForm documentId={documentId} agentId={agentId} />
          </Container>
        </TabsContent>

        <TabsContent value="bulk-import">
          <Container>
            <H2>Bulk Import</H2>
            <p className="text-muted-foreground mb-4">
              Paste a large amount of text and it will be automatically split
              into chunks with embeddings generated.
            </p>
            <BulkImportForm documentId={documentId} agentId={agentId} />
          </Container>
        </TabsContent>

        <TabsContent value="smart-import">
          <Container>
            <H2>Smart Import (AI)</H2>
            <p className="text-muted-foreground mb-4">
              Paste text and the agent&apos;s AI model will intelligently split
              it into semantic chunks with auto-generated titles.
            </p>
            <SmartImportForm documentId={documentId} agentId={agentId} />
          </Container>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
