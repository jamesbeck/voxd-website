"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateOrganisation = async ({
  organisationId,
  name,
  userIds,
}: {
  organisationId: string;
  name: string;
  userIds: string[];
}): Promise<ServerActionResponse> => {
  if (!organisationId) {
    return {
      success: false,
      error: "Organisation ID is required",
    };
  }

  //find the existing organisation
  const existingOrganisation = await db("organisation")
    .select("*")
    .where({ id: organisationId })
    .first();

  if (!existingOrganisation) {
    return {
      success: false,
      error: "Organisation not found",
    };
  }

  //update the organisation
  await db("organisation").where({ id: organisationId }).update({ name });

  //update user associations
  if (userIds) {
    //delete existing associations
    await db("organisationUser").where({ organisationId }).del();
    //insert new associations
    const organisationUserData = userIds.map((userId) => ({
      organisationId,
      userId,
    }));
    await db("organisationUser").insert(organisationUserData);
  }

  return { success: true };
};

export { saUpdateOrganisation };
