import EditExampleForm from "./editExampleForm";
import getIndustries from "@/lib/getIndustries";
import getFunctions from "@/lib/getFunctions";
import { getExampleById } from "@/lib/getExamples";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs from "@/components/admin/RecordTabs";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { notFound } from "next/navigation";
import ExampleConversationsTab from "@/components/admin/ExampleConversationsTab";
import ExampleLogoTab from "./ExampleLogoTab";
import ExampleHeroImageTab from "./ExampleHeroImageTab";
import ExampleInfoTab from "./ExampleInfoTab";
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
  const activeTab = tab || "info";

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
      generationStatus?: "pending" | "generating" | "completed" | "error";
      generationErrorSummary?: string | null;
      generationErrorDetail?: string | null;
      messages:
        | string
        | { role: string; content: string; time: number; annotation: string }[];
    }) => ({
      id: conv.id || "",
      description: conv.description || "",
      prompt: conv.prompt || "",
      startTime: conv.startTime || "09:00",
      generationStatus: conv.generationStatus,
      generationErrorSummary: conv.generationErrorSummary,
      generationErrorDetail: conv.generationErrorDetail,
      messages:
        typeof conv.messages === "string"
          ? JSON.parse(conv.messages)
          : conv.messages,
    }),
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

      <RecordTabs
        value={activeTab}
        tabs={[
          {
            value: "info",
            label: "Info",
            href: `/admin/examples/${example.id}?tab=info`,
          },
          {
            value: "edit",
            label: "Edit",
            href: `/admin/examples/${example.id}?tab=edit`,
          },
          {
            value: "logo",
            label: "Logo",
            href: `/admin/examples/${example.id}?tab=logo`,
          },
          {
            value: "heroImage",
            label: "Hero Image",
            href: `/admin/examples/${example.id}?tab=heroImage`,
          },
          {
            value: "exampleConversations",
            label: "Example Conversations",
            href: `/admin/examples/${example.id}?tab=exampleConversations`,
          },
        ]}
        actions={
          <ExampleActions
            exampleId={example.id}
            title={example.title}
            slug={example.slug}
          />
        }
      >
        <TabsContent value="info">
          <ExampleInfoTab
            id={example.id}
            title={example.title}
            businessName={example.businessName}
            slug={example.slug}
            industries={example.industries}
            functions={example.functions}
          />
        </TabsContent>
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
        <TabsContent value="logo">
          <ExampleLogoTab
            exampleId={example.id}
            logoFileExtension={example.logoFileExtension}
            businessName={example.businessName}
            body={example.body}
          />
        </TabsContent>
        <TabsContent value="heroImage">
          <ExampleHeroImageTab
            exampleId={example.id}
            heroImageFileExtension={example.heroImageFileExtension}
            businessName={example.businessName}
            body={example.body}
          />
        </TabsContent>
        <TabsContent value="exampleConversations">
          <ExampleConversationsTab
            exampleId={example.id}
            conversations={parsedConversations}
            businessName={example.businessName || example.title}
          />
        </TabsContent>
      </RecordTabs>
    </Container>
  );
}
