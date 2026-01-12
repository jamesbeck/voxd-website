import EditExampleForm from "./editExampleForm";
import getIndustries from "@/lib/getIndustries";
import getFunctions from "@/lib/getFunctions";
import { getExampleById } from "@/lib/getExamples";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExampleConversationsTab from "./ExampleConversationsTab";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import ExampleActions from "./exampleActions";

export default async function ExamplesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab || "edit";

  const accessToken = await verifyAccessToken();
  const superAdmin = accessToken.superAdmin;

  const example = await getExampleById(id);

  if (!example) return notFound();

  // Partners can only view their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (example.partnerId !== accessToken.partnerId) {
      return notFound();
    }
  }

  const industries = await getIndustries();
  const functions = await getFunctions();

  // Parse exampleConversations - the messages field may be a string or already parsed
  const parsedConversations = (example.exampleConversations || []).map(
    (conv: {
      id?: string;
      description?: string;
      prompt?: string;
      startTime?: string;
      messages:
        | string
        | { role: string; content: string; time: number; annotation: string }[];
    }) => ({
      id: conv.id || "",
      description: conv.description || "",
      prompt: conv.prompt || "",
      startTime: conv.startTime || "09:00",
      messages:
        typeof conv.messages === "string"
          ? JSON.parse(conv.messages)
          : conv.messages,
    })
  );

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Examples", href: "/admin/examples" },
          { label: example.title },
        ]}
      />
      <H1>{example.title}</H1>

      <Tabs value={activeTab} className="space-y-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="edit" asChild>
              <Link href={`/admin/examples/${example.id}?tab=edit`}>Edit</Link>
            </TabsTrigger>
            <TabsTrigger value="exampleConversations" asChild>
              <Link
                href={`/admin/examples/${example.id}?tab=exampleConversations`}
              >
                Example Conversations
              </Link>
            </TabsTrigger>
          </TabsList>

          <ExampleActions exampleId={example.id} title={example.title} />
        </div>

        <div className="border-b mb-6" />

        <TabsContent value="edit">
          <EditExampleForm
            id={example.id}
            title={example.title}
            short={example.short}
            body={example.body}
            industries={example.industries.map((industry) => industry.id)}
            industriesOptions={industries.map((industry) => ({
              label: industry.name,
              value: industry.id,
            }))}
            functions={example.functions.map((func) => func.id)}
            functionsOptions={functions.map((func) => ({
              label: func.name,
              value: func.id,
            }))}
            partnerId={example.partnerId}
            superAdmin={superAdmin}
          />
        </TabsContent>
        <TabsContent value="exampleConversations">
          <ExampleConversationsTab
            exampleId={example.id}
            conversations={parsedConversations}
            businessName={example.businessName || example.title}
          />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
