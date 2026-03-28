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
    .select("*")
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
    `[userCanLogInToThisDomain] email: ${idToken.email}, partnerId: ${adminUser.partnerId}, organisationId: ${adminUser.organisationId}, superAdmin: ${adminUser.superAdmin}, partnerFromDomain: ${JSON.stringify(partnerFromDomain)}`,
  );

  //if we're a partner (but not super admin), make sure they're logging in to the right domain
  if (!adminUser.superAdmin && adminUser.partnerId) {
    const partnerFromToken = await db("partner")
      .select("domain")
      .where({ id: adminUser.partnerId })
      .first();

    //if domain doesn't match
    if (partnerFromDomain?.domain !== partnerFromToken.domain) {
      console.log(
        `[userCanLogInToThisDomain] FAILED: Domain mismatch for partner user. Expected: ${partnerFromToken.domain}, Got: ${partnerFromDomain?.domain}`,
      );
      return false;
    }
  }

  //if user belongs to an organisation, check that organisation belongs to this partner's domain
  //skip this check if the user already belongs directly to this partner
  if (
    adminUser.organisationId &&
    adminUser.partnerId !== partnerFromDomain?.id
  ) {
    const organisation = await db("organisation")
      .select("partnerId")
      .where({ id: adminUser.organisationId })
      .first();

    if (organisation?.partnerId !== partnerFromDomain?.id) {
      console.log(
        `[userCanLogInToThisDomain] FAILED: Organisation partner mismatch. Org partnerId: ${organisation?.partnerId}, Domain partnerId: ${partnerFromDomain?.id}`,
      );
      return false;
    }
  }

  //if no organisation and not a partner (or super admin), fail
  if (
    !adminUser.superAdmin &&
    !adminUser.partnerId &&
    !adminUser.organisationId
  ) {
    console.log(
      `[userCanLogInToThisDomain] FAILED: User has no superAdmin, no partnerId, and no organisationId`,
    );
    return false;
  }

  //if we get here they are allowed to access this domain
  console.log(`[userCanLogInToThisDomain] SUCCESS: ${idToken.email} allowed`);
  return true;
}
