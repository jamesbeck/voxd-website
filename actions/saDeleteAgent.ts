"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saDeleteAgent = async ({
  agentId,
}: {
  agentId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  //only admin can delete agents
  if (!accessToken?.admin) {
    return { success: false, error: "Unauthorized" };
  }

  await db("agent").delete().where({ id: agentId });

  return { success: true };
};

export default saDeleteAgent;
