"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import {
  refreshAccessToken as googleRefreshAccessToken,
  encryptToken,
  decryptToken,
} from "@/lib/oauth/googleOAuth";

interface RefreshOAuthTokenParams {
  oauthAccountId: string;
}

/**
 * Refresh an OAuth access token
 * Uses the stored refresh token to get a new access token
 */
const saRefreshOAuthToken = async ({
  oauthAccountId,
}: RefreshOAuthTokenParams): Promise<ServerActionResponse> => {
  try {
    // Get the OAuth account
    const oauthAccount = await db("oauthAccount")
      .where({ id: oauthAccountId })
      .first();

    if (!oauthAccount) {
      return { success: false, error: "OAuth account not found" };
    }

    if (oauthAccount.status !== "active") {
      return { success: false, error: "OAuth account is not active" };
    }

    if (!oauthAccount.refreshTokenEncrypted) {
      return { success: false, error: "No refresh token available" };
    }

    // Decrypt the refresh token
    const refreshToken = decryptToken(oauthAccount.refreshTokenEncrypted);

    // Refresh based on provider
    let tokenResponse;
    if (oauthAccount.provider === "google") {
      tokenResponse = await googleRefreshAccessToken(refreshToken);
    } else {
      return { success: false, error: "Unsupported provider" };
    }

    // Calculate new expiry time
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Update the account with new access token
    await db("oauthAccount")
      .where({ id: oauthAccountId })
      .update({
        accessTokenEncrypted: encryptToken(tokenResponse.access_token),
        accessTokenExpiresAt: expiresAt,
        tokenType: tokenResponse.token_type,
        updatedAt: new Date(),
        // If a new refresh token is provided, update it
        ...(tokenResponse.refresh_token && {
          refreshTokenEncrypted: encryptToken(tokenResponse.refresh_token),
        }),
      });

    return {
      success: true,
      data: {
        expiresAt,
      },
    };
  } catch (error) {
    console.error("Error refreshing OAuth token:", error);

    // Mark the account as error status if refresh fails
    try {
      await db("oauthAccount")
        .where({ id: oauthAccountId })
        .update({
          status: "error",
          updatedAt: new Date(),
        });
    } catch (updateError) {
      console.error("Error updating account status:", updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refresh token",
    };
  }
};

export default saRefreshOAuthToken;

/**
 * Get a valid access token for an OAuth account
 * Automatically refreshes if expired
 */
export async function getValidAccessToken(
  oauthAccountId: string
): Promise<string | null> {
  const oauthAccount = await db("oauthAccount")
    .where({ id: oauthAccountId })
    .first();

  if (!oauthAccount || oauthAccount.status !== "active") {
    return null;
  }

  if (!oauthAccount.accessTokenEncrypted) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const expiresAt = new Date(oauthAccount.accessTokenExpiresAt);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt <= fiveMinutesFromNow) {
    // Token is expired or about to expire, refresh it
    const refreshResult = await saRefreshOAuthToken({ oauthAccountId });
    if (!refreshResult.success) {
      return null;
    }

    // Get the updated account
    const updatedAccount = await db("oauthAccount")
      .where({ id: oauthAccountId })
      .first();

    if (!updatedAccount?.accessTokenEncrypted) {
      return null;
    }

    return decryptToken(updatedAccount.accessTokenEncrypted);
  }

  return decryptToken(oauthAccount.accessTokenEncrypted);
}
