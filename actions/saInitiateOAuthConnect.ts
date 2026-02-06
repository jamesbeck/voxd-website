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
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";
import { getOrganisationGoogleCredentials } from "@/lib/getOrganisationGoogleCredentials";

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

  if (!accessToken.organisationId) {
    return {
      success: false,
      error: "You must belong to an organisation to connect OAuth accounts",
    };
  }

  try {
    // Get Google OAuth credentials from the organisation
    const credentials = await getOrganisationGoogleCredentials(
      accessToken.organisationId,
    );

    const state = generateState();
    const scopeList = scopes || getDefaultScopes();

    // State expires after 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Get the current partner domain for cross-domain redirect after OAuth
    const partner = await getPartnerFromHeaders();
    const partnerDomain = partner?.domain || null;

    // Generate callback URL using partner domain
    const callbackUrl = getCallbackUrl(partnerDomain || undefined);

    // Store state in database with origin domain for redirect
    await db("oauthState").insert({
      state,
      adminUserId: accessToken.adminUserId,
      provider,
      scopes: scopeList.join(" "),
      redirectUri: callbackUrl,
      expiresAt,
      metadata: partnerDomain ? { originDomain: partnerDomain } : null,
    });

    // Generate auth URL
    let authUrl: string;
    if (provider === "google") {
      authUrl = getGoogleAuthUrl(state, credentials, scopeList, callbackUrl);
    } else {
      return { success: false, error: "Unsupported provider" };
    }

    return { success: true, data: { authUrl, state } };
  } catch (error) {
    console.error("Error initiating OAuth connect:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initiate OAuth connection",
    };
  }
};

export default saInitiateOAuthConnect;
