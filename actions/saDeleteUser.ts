"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saDeleteUser = async ({
  userId,
}: {
  userId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  //only super admin can delete users
  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  await db("chatUser").delete().where({ id: userId });

  return { success: true };
};

export default saDeleteUser;
