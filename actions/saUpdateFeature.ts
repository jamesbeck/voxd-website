"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateFeature = async ({
  id,
  title,
  slug,
  icon,
  short,
  body,
  topFeature,
}: {
  id: string;
  title: string;
  slug: string;
  icon: string;
  short: string;
  body: string;
  topFeature: boolean;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can edit features
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to edit features.",
    };
  }

  // Get the existing feature
  const existingFeature = await db("feature").where("id", id).first();

  if (!existingFeature) {
    return {
      success: false,
      error: "Feature not found.",
    };
  }

  // Check if slug is already taken by another feature
  if (slug !== existingFeature.slug) {
    const slugExists = await db("feature")
      .where("slug", slug)
      .whereNot("id", id)
      .first();

    if (slugExists) {
      return {
        success: false,
        error: "This slug is already in use by another feature.",
      };
    }
  }

  await db("feature").where("id", id).update({
    title,
    slug,
    icon,
    short,
    body,
    topFeature,
    updatedAt: new Date(),
  });

  return { success: true };
};

export default saUpdateFeature;
