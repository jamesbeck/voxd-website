import db from "@/database/db";
import { verifyIdToken } from "./auth/verifyToken";
import getPartnerFromHeaders from "./getPartnerFromHeaders";

export default async function userCanLogInToThisDomain() {
  const idToken = await verifyIdToken();

  if (!idToken) return false;

  const user = await db("user")
    .select("*")
    .where({ email: idToken.email })
    .first();

  if (!user) return false;

  const partnerFromDomain = await getPartnerFromHeaders();

  //if we're a partner (but not admin), make sure they're logging in to the right domain
  if (!user.admin && user.partnerId) {
    const partnerFromToken = await db("partner")
      .select("domain")
      .where({ id: user.partnerId })
      .first();

    //if domain doesn't match
    if (partnerFromDomain?.domain !== partnerFromToken.domain) {
      return false;
    }
  }

  //get users organisations
  const organisations = await db("organisationUser")
    .leftJoin(
      "organisation",
      "organisationUser.organisationId",
      "organisation.id"
    )
    .select("organisationId", "partnerId")
    .where({ userId: user.id, partnerId: partnerFromDomain?.id });

  //if no organisations and not a partner (or admin), fail
  if (!user.admin && !user.partnerId && !organisations.length) {
    return false;
  }

  //if we get here they are allowed to access this domain
  return true;
}
