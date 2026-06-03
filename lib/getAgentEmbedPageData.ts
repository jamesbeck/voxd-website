import db from "@/database/db";

export type AgentEmbedPageData = {
  agentId: string;
  agentName: string;
  organisationId: string | null;
  organisationName: string | null;
  partnerOrganisationId: string | null;
  partnerName: string | null;
  partnerDomain: string | null;
};

type AgentEmbedPageRow = {
  id: string;
  name: string;
  niceName: string | null;
  organisationId: string | null;
  organisationName: string | null;
  organisationDomain: string | null;
  organisationIsPartner: boolean;
  partnerOrganisationId: string | null;
  partnerOrganisationName: string | null;
  partnerOrganisationDomain: string | null;
};

function normalizeNullableText(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

export default async function getAgentEmbedPageData({
  agentId,
}: {
  agentId: string;
}): Promise<AgentEmbedPageData | null> {
  const row = await db("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .leftJoin(
      "organisation as partnerOrganisation",
      "organisation.partnerId",
      "partnerOrganisation.id",
    )
    .where("agent.id", agentId)
    .select(
      "agent.id",
      "agent.name",
      "agent.niceName",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.domain as organisationDomain",
      db.raw(
        'COALESCE("organisation"."partner", false) as "organisationIsPartner"',
      ),
      "partnerOrganisation.id as partnerOrganisationId",
      "partnerOrganisation.name as partnerOrganisationName",
      "partnerOrganisation.domain as partnerOrganisationDomain",
    )
    .first<AgentEmbedPageRow>();

  if (!row) {
    return null;
  }

  const partnerOrganisationId = row.organisationIsPartner
    ? row.organisationId
    : row.partnerOrganisationId;
  const partnerName = row.organisationIsPartner
    ? row.organisationName
    : row.partnerOrganisationName;
  const partnerDomain = row.organisationIsPartner
    ? row.organisationDomain
    : row.partnerOrganisationDomain;

  return {
    agentId: row.id,
    agentName: row.niceName || row.name,
    organisationId: row.organisationId,
    organisationName: row.organisationName,
    partnerOrganisationId,
    partnerName: normalizeNullableText(partnerName),
    partnerDomain: normalizeNullableText(partnerDomain),
  };
}
