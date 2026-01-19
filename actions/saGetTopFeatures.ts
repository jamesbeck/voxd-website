"use server";

import db from "../database/db";

export type TopFeature = {
  id: string;
  title: string;
  slug: string;
  icon: string;
  short: string;
  topFeature: boolean;
};

const saGetTopFeatures = async (): Promise<TopFeature[]> => {
  const features = await db("feature")
    .select("id", "title", "slug", "icon", "short", "topFeature")
    .where("topFeature", true)
    .orderBy("createdAt", "asc");

  return features;
};

export default saGetTopFeatures;
