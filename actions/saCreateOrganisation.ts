"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreateOrganisation = async ({
  name,
  adminUserIds,
  partnerId,
}: {
  name: string;
  adminUserIds: string[];
  partnerId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // If user is a partner and no partnerId is explicitly provided, use their partnerId
  let finalPartnerId = partnerId;
  if (!finalPartnerId && accessToken.partner && accessToken.partnerId) {
    finalPartnerId = accessToken.partnerId;
  }

  //check organisation name is unique
  const existingOrganisation = await db("organisation")
    .select("*")
    .whereRaw("LOWER(name) = ?", name.toLowerCase())
    .first();

  if (existingOrganisation) {
    return {
      success: false,
      fieldErrors: { name: "Organisation already exists" },
    };
  }

  //create a new organisation
  const [newOrganisation] = await db("organisation")
    .insert({ name, partnerId: finalPartnerId || null })
    .returning("id");

  //create user_organisation associations
  if (adminUserIds && adminUserIds.length > 0) {
    const userOrganisationAssociations = adminUserIds.map((adminUserId) => ({
      adminUserId: adminUserId,
      organisationId: newOrganisation.id,
    }));

    await db("organisationUser").insert(userOrganisationAssociations);
  }

  return { success: true, data: newOrganisation };
};

export { saCreateOrganisation };
