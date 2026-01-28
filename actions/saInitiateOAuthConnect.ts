"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";
import {
  generateState,
  getGoogleAuthUrl,
  getDefaultScopes,
  getCallbackUrl,
} from "@/lib/oauth/googleOAuth";

interface InitiateOAuthConnectParams {
  provider: "google";
  scopes?: string[];
}

/**
 * Initiate OAuth connection flow
 * Generates a state parameter, stores it in oauthState table, and returns the auth URL
 */
const saInitiateOAuthConnect = async ({
  provider,
  scopes,
}: InitiateOAuthConnectParams): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.adminUserId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const state = generateState();
    const scopeList = scopes || getDefaultScopes();

    // State expires after 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store state in database
    await db("oauthState").insert({
      state,
      adminUserId: accessToken.adminUserId,
      provider,
      scopes: scopeList.join(" "),
      redirectUri: getCallbackUrl(),
      expiresAt,
    });

    // Generate auth URL
    let authUrl: string;
    if (provider === "google") {
      authUrl = getGoogleAuthUrl(state, scopeList);
    } else {
      return { success: false, error: "Unsupported provider" };
    }

    return { success: true, data: { authUrl, state } };
  } catch (error) {
    console.error("Error initiating OAuth connect:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate OAuth connection",
    };
  }
};

export default saInitiateOAuthConnect;
