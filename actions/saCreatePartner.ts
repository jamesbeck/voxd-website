"use server";

import { revalidateTag } from "next/cache";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreatePartner = async ({
  name,
  organisationId,
}: {
  name: string;
  organisationId?: string;
}): Promise<ServerActionResponse> => {
  //create a new user
  const [newUser] = await db("partner")
    .insert({ name, organisationId: organisationId || null })
    .returning("id");

  revalidateTag("partners", { expire: 0 });

  return { success: true, data: newUser };
};

export default saCreatePartner;
