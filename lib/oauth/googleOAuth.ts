import crypto from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Default scopes for Google Calendar read/write
const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * Generate a cryptographically secure random state string
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get the callback URL for Google OAuth
 */
export function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/google/callback`;
}

/**
 * Generate the Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state: string, scopes?: string[]): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl(),
    response_type: "code",
    scope: (scopes || DEFAULT_SCOPES).join(" "),
    access_type: "offline", // Required for refresh token
    prompt: "consent", // Force consent screen to get refresh token
    state: state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getCallbackUrl(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  return response.json();
}

/**
 * Revoke a token (access or refresh token)
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  // Google returns 200 even if token is already revoked or invalid
  // Only throw on actual errors
  if (!response.ok && response.status !== 400) {
    const error = await response.text();
    throw new Error(`Failed to revoke token: ${error}`);
  }
}

/**
 * Get user info from Google using an access token
 */
export async function getGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return response.json();
}

// Encryption utilities for storing tokens securely
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.OAUTH_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("OAUTH_ENCRYPTION_KEY environment variable is not set");
  }
  // Ensure key is 32 bytes for AES-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a token for secure storage
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (all hex encoded)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a stored token
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const parts = encryptedToken.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Get default scopes
 */
export function getDefaultScopes(): string[] {
  return [...DEFAULT_SCOPES];
}
