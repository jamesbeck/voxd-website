"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saSendMessage = async ({
  message,
  sessionId,
}: {
  message: string;
  sessionId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  try {
    const session = await db("session")
      .leftJoin("agent", "session.agentId", "agent.id")
      .leftJoin("phoneNumber", "agent.phoneNumberId", "phoneNumber.id")
      .leftJoin("user", "session.userId", "user.id")
      .where({ "session.id": sessionId })
      .select(
        "session.id",
        "session.sessionType",
        "phoneNumber.metaId as phoneNumberMetaId",
        "agent.id as agentId",
        "user.number as userPhoneNumber"
      )
      .first();
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP;

    //if session type is live use the agents phone number to send
    //if session type is development, use the development waba number (701062049765457)
    //if session type is test, use the test number (743921902140200)

    let phoneNumberMetaIdToUse = session.phoneNumberMetaId;
    if (session.sessionType === "development")
      phoneNumberMetaIdToUse = "701062049765457";
    else if (session.sessionType === "test")
      phoneNumberMetaIdToUse = "743921902140200";

    const url = `${process.env.META_GRAPH_URL}/${
      phoneNumberMetaIdToUse || "701062049765457"
    }/messages`;

    const payload = {
      messaging_product: "whatsapp",
      //in dev mode, for safety, always send to the dev number only!
      to:
        process.env.NODE_ENV === "development"
          ? process.env.DEVELOPMENT_USER_PHONE_NUMBER!
          : session.userPhoneNumber,
      text: { body: message },
    } as const;

    const res = await (globalThis.fetch as any)(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    //facebook appears to silently fail if we can't message this user (24hr window)

    if (!res.ok) {
      console.error("Error response from Meta API:", data);
      return { success: false, error: "Failed to send message via Meta API" };
    } else {
      //store in manual messages table
      await db("manualMessage").insert({
        sessionId: session.id,
        text: message,
        whatsappMessageId: data.messages[0].id,
        adminUserId: accessToken.adminUserId,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
};

export default saSendMessage;
