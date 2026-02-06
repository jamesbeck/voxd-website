import db from "../database/db";

const getAdminUserById = async ({ adminUserId }: { adminUserId: string }) => {
  const user = await db("adminUser")
    .select("adminUser.*")
    .select("organisation.name as organisationName")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .where("adminUser.id", adminUserId)
    .first();

  return user;
};

export default getAdminUserById;
