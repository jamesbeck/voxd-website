"use server";

import db from "@/database/db";

export type AgentDemoData = {
  agentId: string;
  agentNiceName: string;
  organisationId: string;
  organisationName: string;
  logoFileExtension: string | null;
  showLogoOnColour: string | null;
  primaryColour: string | null;
  coreDomain: string | null;
};

export default async function saGetAgentDemoData({
  agentId,
}: {
  agentId: string;
}): Promise<AgentDemoData | null> {
  const row = await db("agent")
    .join("organisation", "organisation.id", "agent.organisationId")
    .join(
      "organisation as partnerOrganisation",
      "partnerOrganisation.id",
      "organisation.partnerId",
    )
    .select(
      "agent.id as agentId",
      "agent.niceName as agentNiceName",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.logoFileExtension",
      "organisation.showLogoOnColour",
      "organisation.primaryColour",
      "partnerOrganisation.coreDomain",
    )
    .where("agent.id", agentId)
    .first();

  if (!row) return null;

  return {
    agentId: row.agentId,
    agentNiceName: row.agentNiceName || "Agent",
    organisationId: row.organisationId,
    organisationName: row.organisationName || "Company",
    logoFileExtension: row.logoFileExtension || null,
    showLogoOnColour: row.showLogoOnColour || null,
    primaryColour: row.primaryColour || null,
    coreDomain: row.coreDomain || null,
  };
}
