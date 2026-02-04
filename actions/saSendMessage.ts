"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

/**
 * Get access token for a phone number by its Meta ID via its WABA
 */
async function getAccessTokenForPhoneNumberMetaId(
  metaId: string,
): Promise<string | null> {
  const phoneNumber = await db("phoneNumber").where({ metaId }).first();

  if (phoneNumber?.wabaId) {
    const waba = await db("waba").where({ id: phoneNumber.wabaId }).first();

    if (waba?.appId) {
      const app = await db("metaApp").where({ id: waba.appId }).first();
      if (app?.accessToken) {
        return app.accessToken;
      }
    }
  }

  return null;
}

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
      .leftJoin("chatUser", "session.userId", "chatUser.id")
      .leftJoin("agent", "chatUser.agentId", "agent.id")
      .leftJoin("phoneNumber", "agent.phoneNumberId", "phoneNumber.id")
      .where({ "session.id": sessionId })
      .select(
        "session.id",
        "session.sessionType",
        "phoneNumber.metaId as phoneNumberMetaId",
        "agent.id as agentId",
        "chatUser.number as userPhoneNumber",
      )
      .first();
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    //if session type is live use the agents phone number to send
    //if session type is development, use the development waba number (701062049765457)

    let phoneNumberMetaIdToUse = session.phoneNumberMetaId;
    if (session.sessionType === "development")
      phoneNumberMetaIdToUse = "701062049765457";

    const finalPhoneNumberMetaId = phoneNumberMetaIdToUse || "701062049765457";

    const META_ACCESS_TOKEN = await getAccessTokenForPhoneNumberMetaId(
      finalPhoneNumberMetaId,
    );

    if (!META_ACCESS_TOKEN) {
      return {
        success: false,
        error:
          "No access token available for this phone number. Please ensure it is linked to an app via its WABA.",
      };
    }

    const url = `${process.env.META_GRAPH_URL}/${finalPhoneNumberMetaId}/messages`;

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
