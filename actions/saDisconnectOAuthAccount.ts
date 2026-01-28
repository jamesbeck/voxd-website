"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";
import { revokeToken, decryptToken } from "@/lib/oauth/googleOAuth";
import { addLog } from "@/lib/addLog";

interface DisconnectOAuthAccountParams {
  oauthAccountId: string;
}

/**
 * Disconnect an OAuth account
 * Revokes the token with the provider and marks the account as revoked
 */
const saDisconnectOAuthAccount = async ({
  oauthAccountId,
}: DisconnectOAuthAccountParams): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.adminUserId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the OAuth account
    const oauthAccount = await db("oauthAccount")
      .where({ id: oauthAccountId })
      .first();

    if (!oauthAccount) {
      return { success: false, error: "OAuth account not found" };
    }

    // Verify ownership - user can only disconnect their own accounts
    if (oauthAccount.adminUserId !== accessToken.adminUserId) {
      // Super admins can disconnect any account
      if (!accessToken.superAdmin) {
        return {
          success: false,
          error: "You can only disconnect your own accounts",
        };
      }
    }

    // Try to revoke the token with the provider
    try {
      if (oauthAccount.refreshTokenEncrypted) {
        const refreshToken = decryptToken(oauthAccount.refreshTokenEncrypted);
        await revokeToken(refreshToken);
      } else if (oauthAccount.accessTokenEncrypted) {
        const accessTokenValue = decryptToken(
          oauthAccount.accessTokenEncrypted,
        );
        await revokeToken(accessTokenValue);
      }
    } catch (revokeError) {
      // Log but don't fail - we still want to mark as revoked locally
      console.error("Error revoking token with provider:", revokeError);
    }

    // Update the account status
    await db("oauthAccount").where({ id: oauthAccountId }).update({
      status: "revoked",
      revokedAt: new Date(),
      updatedAt: new Date(),
    });

    // Log the action
    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "OAuth Account Disconnected",
      description: `Disconnected ${oauthAccount.provider} account (${oauthAccount.email})`,
      partnerId: accessToken.partnerId,
      organisationId: accessToken.organisationId,
      data: {
        oauthAccountId,
        provider: oauthAccount.provider,
        email: oauthAccount.email,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting OAuth account:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect OAuth account",
    };
  }
};

export default saDisconnectOAuthAccount;
