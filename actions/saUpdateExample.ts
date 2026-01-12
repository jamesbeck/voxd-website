"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateExample = async ({
  id,
  title,
  short,
  body,
  industries,
  functions,
  partnerId,
}: {
  id: string;
  title: string;
  short: string;
  body: string;
  industries: string[];
  functions: string[];
  partnerId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only partners and super admins can edit examples
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "You do not have permission to edit examples.",
    };
  }

  // Get the existing example to check ownership
  const existingExample = await db("example").where("id", id).first();

  if (!existingExample) {
    return {
      success: false,
      error: "Example not found.",
    };
  }

  // Partners can only edit their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (existingExample.partnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You can only edit your own examples.",
      };
    }
  }

  // Build the update object
  const updateData: {
    title: string;
    short: string;
    body: string;
    partnerId?: string | null;
  } = {
    title,
    short,
    body,
  };

  // Only super admins can change the partnerId
  if (accessToken.superAdmin && partnerId !== undefined) {
    updateData.partnerId = partnerId || null;
  }

  await db("example").where("id", id).update(updateData);

  console.log("adding", industries.length, "industries");

  await db("exampleIndustry").where("exampleId", id).delete();

  if (industries.length > 0) {
    await db("exampleIndustry")
      .insert(
        industries.map((industryId) => ({
          exampleId: id,
          industryId: industryId,
        }))
      )
      .returning("*");
  }

  console.log("adding", functions.length, "functions");

  await db("exampleFunction").where("exampleId", id).delete();

  if (functions.length > 0) {
    await db("exampleFunction")
      .insert(
        functions.map((funcId) => ({
          exampleId: id,
          functionId: funcId,
        }))
      )
      .returning("*");
  }

  return { success: true };
};

export default saUpdateExample;
