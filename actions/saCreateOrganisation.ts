"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const saCreateOrganisation = async ({
  name,
}: {
  name: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admin users or users with a partnerId can create organisations
  if (!accessToken.superAdmin && !accessToken.partnerId) {
    return {
      success: false,
      error: "You do not have permission to create organisations",
    };
  }

  // Always use the partnerId from the creator's token
  const partnerId = accessToken.partnerId;

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
    .insert({ name, partnerId: partnerId || null })
    .returning("id");

  // Log organisation creation
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Organisation Created",
    description: `Organisation "${name}" created`,
    organisationId: newOrganisation.id,
    partnerId: partnerId,
    data: {
      name,
    },
  });

  return { success: true, data: newOrganisation };
};

export { saCreateOrganisation };
