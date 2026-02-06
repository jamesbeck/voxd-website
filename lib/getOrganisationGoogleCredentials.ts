import db from "@/database/db";

export interface GoogleOAuthCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Get Google OAuth credentials for an organisation
 * Throws an error if credentials are not configured
 */
export async function getOrganisationGoogleCredentials(
  organisationId: string,
): Promise<GoogleOAuthCredentials> {
  const organisation = await db("organisation")
    .where({ id: organisationId })
    .select("googleClientId", "googleClientSecret")
    .first();

  if (!organisation) {
    throw new Error("Organisation not found");
  }

  if (!organisation.googleClientId || !organisation.googleClientSecret) {
    throw new Error(
      "Google OAuth credentials are not configured for this organisation",
    );
  }

  return {
    clientId: organisation.googleClientId,
    clientSecret: organisation.googleClientSecret,
  };
}

/**
 * Get Google OAuth credentials for an admin user by looking up their organisation
 */
export async function getGoogleCredentialsByAdminUserId(
  adminUserId: string,
): Promise<GoogleOAuthCredentials> {
  const adminUser = await db("adminUser")
    .where({ id: adminUserId })
    .select("organisationId")
    .first();

  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  if (!adminUser.organisationId) {
    throw new Error("Admin user does not belong to an organisation");
  }

  return getOrganisationGoogleCredentials(adminUser.organisationId);
}
