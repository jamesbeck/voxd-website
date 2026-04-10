import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import RecordTabs from "@/components/admin/RecordTabs";
import { TabsContent } from "@/components/ui/tabs";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound, redirect } from "next/navigation";
import db from "@/database/db";
import EditProviderApiKeyForm from "./editProviderApiKeyForm";
import NewProviderApiKeyForm from "./newProviderApiKeyForm";
import ProviderApiKeyActions from "./providerApiKeyActions";

export default async function Page({
  params,
}: {
  params: { providerApiKeyId: string };
}) {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    redirect("/admin");
  }

  const providerApiKeyId = (await params).providerApiKeyId;

  if (providerApiKeyId === "new") {
    return (
      <Container>
        <BreadcrumbSetter
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            {
              label: "Provider API Keys",
              href: "/admin/provider-api-keys",
            },
            { label: "New Key" },
          ]}
        />
        <H1>New Provider API Key</H1>
        <NewProviderApiKeyForm />
      </Container>
    );
  }

  const providerApiKey = await db("providerApiKey")
    .leftJoin("provider", "providerApiKey.providerId", "provider.id")
    .leftJoin(
      "organisation",
      "providerApiKey.organisationId",
      "organisation.id",
    )
    .where("providerApiKey.id", providerApiKeyId)
    .select(
      "providerApiKey.*",
      "provider.name as providerName",
      "organisation.name as organisationName",
    )
    .first();

  if (!providerApiKey) return notFound();

  const maskedKey =
    providerApiKey.key && providerApiKey.key.length > 12
      ? `${providerApiKey.key.slice(0, 6)}...${providerApiKey.key.slice(-4)}`
      : "***";

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Provider API Keys", href: "/admin/provider-api-keys" },
          { label: `${providerApiKey.providerName} — ${maskedKey}` },
        ]}
      />
      <H1>
        {providerApiKey.providerName} — {maskedKey}
      </H1>
      <RecordTabs
        defaultValue="info"
        tabs={[
          { value: "info", label: "Info" },
          { value: "edit", label: "Edit" },
        ]}
        actions={<ProviderApiKeyActions providerApiKeyId={providerApiKey.id} />}
      >
        <TabsContent value="info">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Provider</div>
              <div>{providerApiKey.providerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Organisation</div>
              <div>{providerApiKey.organisationName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Key</div>
              <div className="font-mono text-sm">{maskedKey}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div>
                {providerApiKey.createdAt
                  ? new Date(providerApiKey.createdAt).toLocaleDateString(
                      "en-GB",
                    )
                  : "—"}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="edit">
          <EditProviderApiKeyForm
            providerApiKeyId={providerApiKey.id}
            currentKey={providerApiKey.key}
            providerId={providerApiKey.providerId}
            providerName={providerApiKey.providerName}
          />
        </TabsContent>
      </RecordTabs>
    </Container>
  );
}
