"use server";

import db from "@/database/db";
import { getScopedAgentForAdminUser } from "@/lib/adminUserPermissions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
type RunCustomFunctionResponse =
  | {
      success: true;
      data?: Record<string, unknown>;
    }
  | {
      success: false;
      error?: string;
      data?: Record<string, unknown>;
    };

type RunMode = "sync" | "async";
type TargetScope = "agent" | "user" | "session";

type CustomFunctionRecord = {
  id: string;
  key: string;
  targetScopes: string[];
};

const coreBaseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_CORE_BASE_URL || "https://core.voxd.ai";

const saRunCustomFunction = async ({
  agentId,
  functionKey,
  mode = "sync",
  targetScope,
  chatUserId,
  sessionId,
  input,
}: {
  agentId: string;
  functionKey: string;
  mode?: RunMode;
  targetScope?: TargetScope;
  chatUserId?: string | null;
  sessionId?: string | null;
  input?: Record<string, unknown>;
}): Promise<RunCustomFunctionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!agentId) {
    return { success: false, error: "agentId is required" };
  }

  if (!functionKey) {
    return { success: false, error: "functionKey is required" };
  }

  if (mode !== "sync" && mode !== "async") {
    return { success: false, error: "mode must be sync or async" };
  }

  const scopedAgent = await getScopedAgentForAdminUser({
    agentId,
    targetAdminUser: {
      superAdmin: accessToken.superAdmin,
      isPartnerUser: accessToken.partner,
      partnerId: accessToken.partnerId,
      organisationId: accessToken.organisationId,
    },
  });

  if (!scopedAgent) {
    return {
      success: false,
      error: "Unauthorized: You do not have access to this agent",
    };
  }

  const customFunction = await db("customFunction")
    .select<
      CustomFunctionRecord[]
    >("customFunction.id", "customFunction.key", "customFunction.targetScopes")
    .where("customFunction.agentId", agentId)
    .where("customFunction.key", functionKey)
    .whereNull("customFunction.archivedAt")
    .where("customFunction.enabled", true)
    .where("customFunction.allowManualRun", true)
    .where("customFunction.allowApiRun", true)
    .first();

  if (!customFunction) {
    return {
      success: false,
      error: "Custom function not found or unavailable for manual execution",
    };
  }

  const resolvedTargetScope = (targetScope ||
    (customFunction.targetScopes.length === 1
      ? customFunction.targetScopes[0]
      : null)) as TargetScope | null;

  if (!resolvedTargetScope) {
    return {
      success: false,
      error: "targetScope is required for functions with multiple scopes",
    };
  }

  if (!customFunction.targetScopes.includes(resolvedTargetScope)) {
    return {
      success: false,
      error: "Selected targetScope is not supported by this function",
    };
  }

  if (resolvedTargetScope === "user") {
    if (!chatUserId) {
      return { success: false, error: "chatUserId is required" };
    }

    const chatUser = await db("chatUser")
      .select("chatUser.id")
      .where("chatUser.id", chatUserId)
      .where("chatUser.agentId", agentId)
      .first();

    if (!chatUser) {
      return {
        success: false,
        error: "User not found for this agent",
      };
    }
  }

  if (resolvedTargetScope === "session") {
    if (!sessionId) {
      return { success: false, error: "sessionId is required" };
    }

    const session = await db("session")
      .leftJoin("chatUser", "session.userId", "chatUser.id")
      .select("session.id")
      .where("session.id", sessionId)
      .where("chatUser.agentId", agentId)
      .first();

    if (!session) {
      return {
        success: false,
        error: "Session not found for this agent",
      };
    }
  }

  try {
    const response = await fetch(`${coreBaseUrl}/api/runCustomFunction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        functionKey,
        mode,
        targetScope: resolvedTargetScope,
        chatUserId: resolvedTargetScope === "user" ? chatUserId : null,
        sessionId: resolvedTargetScope === "session" ? sessionId : null,
        input: input || {},
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to run custom function",
        data: data?.data,
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error running custom function:", error);
    return {
      success: false,
      error: "Failed to run custom function",
    };
  }
};

export default saRunCustomFunction;
