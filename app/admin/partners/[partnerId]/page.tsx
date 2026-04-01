import H1 from "@/components/adminui/H1";
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs from "@/components/admin/RecordTabs";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Partner } from "@/types/types";
import NewPartnerForm from "./newPartnerForm";
import { notFound } from "next/navigation";
import EditPartnerForm from "./editPartnerForm";
import getPartnerById from "@/lib/getPartnerById";
import QuotesTable from "@/components/admin/QuotesTable";
import db from "@/database/db";

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

  let organisationName: string | undefined;
  if (partner?.organisationId) {
    const org = await db("organisation")
      .select("name")
      .where("id", partner.organisationId)
      .first();
    organisationName = org?.name;
  }

  let prototypingAgentLabel: string | undefined;
  if (partner?.prototypingAgentId) {
    const agent = await db("agent")
      .select(
        "agent.niceName",
        "agent.name",
        "organisation.name as organisationName",
      )
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("agent.id", partner.prototypingAgentId)
      .first();
    if (agent) {
      prototypingAgentLabel = `${agent.organisationName || "No Organisation"} - ${agent.niceName || agent.name}`;
    }
  }

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
          <RecordTabs
            defaultValue="edit"
            tabs={[
              { value: "edit", label: "Edit Partner" },
              { value: "quotes", label: "Quotes" },
            ]}
          >
            <TabsContent value="edit">
              <EditPartnerForm
                partnerId={partnerId}
                name={partner.name}
                domain={partner.domain}
                coreDomain={partner.coreDomain ?? undefined}
                openAiApiKey={partner.openAiApiKey}
                sendEmailFromDomain={partner.sendEmailFromDomain}
                salesBotName={partner.salesBotName}
                legalName={partner.legalName}
                companyNumber={partner.companyNumber}
                registeredAddress={partner.registeredAddress}
                legalEmail={partner.legalEmail}
                goCardlessMandateLink={partner.goCardlessMandateLink}
                salesEmail={partner.salesEmail}
                accountsEmail={partner.accountsEmail}
                organisationId={partner.organisationId}
                organisationName={organisationName}
                prototypingAgentId={partner.prototypingAgentId}
                prototypingAgentLabel={prototypingAgentLabel}
              />
            </TabsContent>
            <TabsContent value="quotes">
              <QuotesTable partnerId={partner.id} isSuperAdmin={true} />
            </TabsContent>
            {/* <TabsContent value="sessions">
              <H2>Sessions</H2>
              <SessionsTable partnerId={partnerId} />
            </TabsContent> */}
          </RecordTabs>
        </>
      )}
      {!partner && <NewPartnerForm />}
    </Container>
  );
}
