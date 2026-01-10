"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteOrganisation = async ({
  organisationId,
}: {
  organisationId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.superAdmin && !accessToken?.partner) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the organisation
    const organisation = await db("organisation")
      .where({ id: organisationId })
      .select("partnerId")
      .first();

    if (!organisation) {
      return { success: false, error: "Organisation not found" };
    }

    // If user is a partner, verify they own this organisation
    if (accessToken.partner && !accessToken.superAdmin) {
      if (organisation.partnerId !== accessToken.partnerId) {
        return { success: false, error: "Unauthorized" };
      }
    }

    // Check if organisation has any agents
    const agentCount = await db("agent")
      .where({ organisationId })
      .count("id as count")
      .first();

    if (agentCount && parseInt(agentCount.count as string) > 0) {
      return {
        success: false,
        error:
          "Cannot delete organisation with associated agents. Please delete all agents first.",
      };
    }

    // Delete organisation (cascade will handle related records)
    await db("organisation").where({ id: organisationId }).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting organisation:", error);
    return { success: false, error: "Failed to delete organisation" };
  }
};

export default saDeleteOrganisation;
