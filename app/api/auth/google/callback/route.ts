import { NextRequest, NextResponse } from "next/server";
import db from "@/database/db";
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
  encryptToken,
} from "@/lib/oauth/googleOAuth";
import { addLog } from "@/lib/addLog";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const errorPageUrl = `${baseUrl}/admin/oauth-accounts/error`;
  const successUrl = `${baseUrl}/admin/oauth-accounts`;

  // Handle OAuth errors from Google
  if (error) {
    const errorDescription = searchParams.get("error_description") || error;
    console.error("Google OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${errorPageUrl}?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("Missing code or state parameter");
    return NextResponse.redirect(
      `${errorPageUrl}?error=${encodeURIComponent("Missing authorization code or state")}`,
    );
  }

  try {
    // Look up the state in the database
    const oauthState = await db("oauthState")
      .where({ state })
      .where("expiresAt", ">", new Date())
      .first();

    if (!oauthState) {
      console.error("Invalid or expired state:", state);
      return NextResponse.redirect(
        `${errorPageUrl}?error=${encodeURIComponent("Invalid or expired authorization state. Please try again.")}`,
      );
    }

    const { adminUserId, provider, scopes } = oauthState;

    // Exchange the code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokenResponse.access_token);

    // Calculate token expiry
    const accessTokenExpiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000,
    );

    // Check if this account is already connected
    const existingAccount = await db("oauthAccount")
      .where({
        adminUserId,
        provider,
        providerUserId: userInfo.id,
      })
      .first();

    if (existingAccount) {
      // Update existing account
      await db("oauthAccount")
        .where({ id: existingAccount.id })
        .update({
          email: userInfo.email,
          scopes: tokenResponse.scope,
          accessTokenEncrypted: encryptToken(tokenResponse.access_token),
          accessTokenExpiresAt,
          tokenType: tokenResponse.token_type,
          status: "active",
          updatedAt: new Date(),
          revokedAt: null,
          // Only update refresh token if a new one was provided
          ...(tokenResponse.refresh_token && {
            refreshTokenEncrypted: encryptToken(tokenResponse.refresh_token),
          }),
        });

      await addLog({
        adminUserId,
        event: "OAuth Account Reconnected",
        description: `Reconnected ${provider} account (${userInfo.email})`,
        data: {
          oauthAccountId: existingAccount.id,
          provider,
          email: userInfo.email,
        },
      });
    } else {
      // Create new OAuth account
      const [newAccount] = await db("oauthAccount")
        .insert({
          adminUserId,
          provider,
          providerUserId: userInfo.id,
          email: userInfo.email,
          scopes: tokenResponse.scope,
          accessTokenEncrypted: encryptToken(tokenResponse.access_token),
          accessTokenExpiresAt,
          refreshTokenEncrypted: tokenResponse.refresh_token
            ? encryptToken(tokenResponse.refresh_token)
            : null,
          tokenType: tokenResponse.token_type,
          status: "active",
        })
        .returning("id");

      await addLog({
        adminUserId,
        event: "OAuth Account Connected",
        description: `Connected ${provider} account (${userInfo.email})`,
        data: {
          oauthAccountId: newAccount.id,
          provider,
          email: userInfo.email,
        },
      });
    }

    // Clean up the state record
    await db("oauthState").where({ id: oauthState.id }).delete();

    // Redirect to success page
    return NextResponse.redirect(`${successUrl}?connected=true`);
  } catch (err) {
    console.error("Error in OAuth callback:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.redirect(
      `${errorPageUrl}?error=${encodeURIComponent(errorMessage)}`,
    );
  }
}
