import db from "@/database/db";
import { verifyIdToken } from "./auth/verifyToken";
import getPartnerFromHeaders from "./getPartnerFromHeaders";

export default async function userCanLogInToThisDomain() {
  const idToken = await verifyIdToken();

  if (!idToken) return false;

  const adminUser = await db("adminUser")
    .select("*")
    .whereRaw("LOWER(email) = LOWER(?)", [idToken.email])
    .first();

  if (!adminUser) return false;

  const partnerFromDomain = await getPartnerFromHeaders();

  //if we're a partner (but not super admin), make sure they're logging in to the right domain
  if (!adminUser.superAdmin && adminUser.partnerId) {
    const partnerFromToken = await db("partner")
      .select("domain")
      .where({ id: adminUser.partnerId })
      .first();

    //if domain doesn't match
    if (partnerFromDomain?.domain !== partnerFromToken.domain) {
      return false;
    }
  }

  //if user belongs to an organisation, check that organisation belongs to this partner's domain
  if (adminUser.organisationId) {
    const organisation = await db("organisation")
      .select("partnerId")
      .where({ id: adminUser.organisationId })
      .first();

    if (organisation?.partnerId !== partnerFromDomain?.id) {
      return false;
    }
  }

  //if no organisation and not a partner (or super admin), fail
  if (
    !adminUser.superAdmin &&
    !adminUser.partnerId &&
    !adminUser.organisationId
  ) {
    return false;
  }

  //if we get here they are allowed to access this domain
  return true;
}
