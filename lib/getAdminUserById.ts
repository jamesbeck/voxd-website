import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { applyAdminUserScope } from "@/lib/adminUserAccess";

const getAdminUserById = async ({ adminUserId }: { adminUserId: string }) => {
  const accessToken = await verifyAccessToken();

  const query = db("adminUser")
    .select("adminUser.*")
    .select("organisation.name as organisationName")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .where("adminUser.id", adminUserId);

  applyAdminUserScope(query, accessToken);

  const user = await query.first();

  return user;
};

export default getAdminUserById;
