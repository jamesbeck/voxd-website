import db from "@/database/db";
import { verifyIdToken } from "./auth/verifyToken";
import getPartnerFromHeaders from "./getPartnerFromHeaders";

export default async function userCanLogInToThisDomain() {
  const idToken = await verifyIdToken();

  if (!idToken) {
    console.log("[userCanLogInToThisDomain] FAILED: No id token found");
    return false;
  }

  const adminUser = await db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .select(
      "adminUser.id",
      "adminUser.organisationId",
      "adminUser.superAdmin",
      db.raw('organisation.partner as "organisationIsPartner"'),
      db.raw('organisation."partnerId" as "organisationPartnerId"'),
    )
    .whereRaw("LOWER(email) = LOWER(?)", [idToken.email])
    .first();

  if (!adminUser) {
    console.log(
      `[userCanLogInToThisDomain] FAILED: No adminUser found for email: ${idToken.email}`,
    );
    return false;
  }

  const partnerFromDomain = await getPartnerFromHeaders();
  console.log(
    `[userCanLogInToThisDomain] email: ${idToken.email}, organisationId: ${adminUser.organisationId}, organisationIsPartner: ${adminUser.organisationIsPartner}, organisationPartnerId: ${adminUser.organisationPartnerId}, superAdmin: ${adminUser.superAdmin}, partnerFromDomain: ${JSON.stringify(partnerFromDomain)}`,
  );

  if (adminUser.superAdmin) {
    console.log(`[userCanLogInToThisDomain] SUCCESS: ${idToken.email} allowed`);
    return true;
  }

  if (!adminUser.organisationId) {
    console.log(
      `[userCanLogInToThisDomain] FAILED: User has no organisation and is not super admin`,
    );
    return false;
  }

  if (!partnerFromDomain) {
    console.log(
      `[userCanLogInToThisDomain] FAILED: No partner organisation resolved for the current domain`,
    );
    return false;
  }

  if (adminUser.organisationIsPartner) {
    if (adminUser.organisationId !== partnerFromDomain.id) {
      console.log(
        `[userCanLogInToThisDomain] FAILED: Partner organisation mismatch. User organisationId: ${adminUser.organisationId}, Domain partner organisationId: ${partnerFromDomain.id}`,
      );
      return false;
    }
  } else if (adminUser.organisationPartnerId !== partnerFromDomain.id) {
    console.log(
      `[userCanLogInToThisDomain] FAILED: Organisation partner mismatch. Org partnerId: ${adminUser.organisationPartnerId}, Domain partner organisationId: ${partnerFromDomain.id}`,
    );
    return false;
  }

  //if we get here they are allowed to access this domain
  console.log(`[userCanLogInToThisDomain] SUCCESS: ${idToken.email} allowed`);
  return true;
}
