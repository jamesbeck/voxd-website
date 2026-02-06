import H1 from "@/components/adminui/H1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Partner } from "@/types/types";
import NewPartnerForm from "./newPartnerForm";
import { notFound } from "next/navigation";
import EditPartnerForm from "./editPartnerForm";
import getPartnerById from "@/lib/getPartnerById";
import LogoTab from "./logoTab";
import QuotesTable from "@/components/admin/QuotesTable";

export default async function Page({
  params,
}: {
  params: { partnerId: string };
}) {
  const partnerId = (await params).partnerId;

  let partner: Partner | null = null;

  if (partnerId && partnerId != "new")
    partner = await getPartnerById({ partnerId: partnerId });

  if (!partner && partnerId !== "new") return notFound();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Partners", href: "/admin/partners" },
          { label: partner?.name || "New Partner" },
        ]}
      />
      <H1>{partner?.name || "New Partner"}</H1>
      {partner && (
        <>
          <Tabs defaultValue="edit" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit Partner</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="quotes">Quotes</TabsTrigger>
              {/* <TabsTrigger value="sessions">Sessions</TabsTrigger> */}
            </TabsList>

            <div className="border-b mb-6" />

            <TabsContent value="edit">
              <EditPartnerForm
                partnerId={partnerId}
                name={partner.name}
                domain={partner.domain}
                colour={partner.colour}
                openAiApiKey={partner.openAiApiKey}
              />
            </TabsContent>
            <TabsContent value="logo">
              <LogoTab
                partnerId={partner.id}
                partnerDomain={partner.domain}
                logoFileExtension={partner.logoFileExtension ?? null}
              />
            </TabsContent>
            <TabsContent value="quotes">
              <QuotesTable
                partnerId={partner.id}
                isSuperAdmin={true}
              />
            </TabsContent>
            {/* <TabsContent value="sessions">
              <H2>Sessions</H2>
              <SessionsTable partnerId={partnerId} />
            </TabsContent> */}
          </Tabs>
        </>
      )}
      {!partner && <NewPartnerForm />}
    </Container>
  );
}
