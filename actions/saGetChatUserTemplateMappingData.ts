"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { TemplateChatUserRecord } from "@/lib/templateMessages";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saGetChatUserTemplateMappingData = async ({
  agentId,
  chatUserId,
}: {
  agentId: string;
  chatUserId: string;
}): Promise<{
  success: boolean;
  error?: string;
  chatUser?: TemplateChatUserRecord;
}> => {
  const accessToken = await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return { success: false, error: "Unauthorized" };
  }

  const chatUser = await db("chatUser")
    .where("chatUser.id", chatUserId)
    .where("chatUser.agentId", agentId)
    .select(
      "chatUser.id",
      "chatUser.name",
      "chatUser.number",
      "chatUser.email",
      "chatUser.externalId",
      "chatUser.data",
    )
    .first();

  if (!chatUser) {
    return { success: false, error: "Chat user not found" };
  }

  return {
    success: true,
    chatUser,
  };
};

export default saGetChatUserTemplateMappingData;
