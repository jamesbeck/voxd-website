"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreateFeature = async ({
  title,
  slug,
  icon,
  short,
  body,
  topFeature,
}: {
  title: string;
  slug: string;
  icon: string;
  short: string;
  body: string;
  topFeature: boolean;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can create features
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to create features.",
    };
  }

  // Check if slug is already taken
  const slugExists = await db("feature").where("slug", slug).first();

  if (slugExists) {
    return {
      success: false,
      error: "This slug is already in use.",
    };
  }

  const [feature] = await db("feature")
    .insert({
      title,
      slug,
      icon,
      short,
      body,
      topFeature,
    })
    .returning("*");

  return { success: true, data: feature };
};

export default saCreateFeature;
