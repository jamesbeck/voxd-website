import db from "../database/db";

const getAdminUserById = async ({ adminUserId }: { adminUserId: string }) => {
  const user = await db("adminUser")
    .leftJoin(
      "organisationUser",
      "adminUser.id",
      "organisationUser.adminUserId"
    )
    .groupBy("adminUser.id")
    .select("adminUser.*")
    .select([
      db.raw(
        'COALESCE(ARRAY_AGG("organisationUser"."organisationId") FILTER (WHERE "organisationUser"."organisationId" IS NOT NULL), ARRAY[]::uuid[]) as "organisationIds"'
      ),
    ])
    .where("adminUser.id", adminUserId)
    .first();

  return user;
};

export default getAdminUserById;
