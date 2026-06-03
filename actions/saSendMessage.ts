"use server";

import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import getSessionById from "@/lib/getSessionById";

const saSendMessage = async ({
  message,
  sessionId,
}: {
  message: string;
  sessionId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();
  const session = await getSessionById({ sessionId });

  if (!session) {
    return { success: false, error: "Session not found" };
  }

  if (session.deletedByUser) {
    return {
      success: false,
      error: "Cannot send a manual reply to a session deleted by the user",
    };
  }

  const coreBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_CORE_BASE_URL || "https://core.voxd.ai";

  try {
    const res = await fetch(`${coreBaseUrl}/api/admin/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        message,
        adminUserId: accessToken.adminUserId,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      return { success: false, error: data.error || "Failed to send message" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
};

export default saSendMessage;
