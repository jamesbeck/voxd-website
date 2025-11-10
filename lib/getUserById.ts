import db from "../database/db";

const getUserById = async ({ userId }: { userId: string }) => {
  const user = await db("user")
    .leftJoin("organisationUser", "user.id", "organisationUser.userId")
    .groupBy("user.id")
    .select("user.*")
    .select([
      db.raw(
        'COALESCE(ARRAY_AGG("organisationUser"."organisationId") FILTER (WHERE "organisationUser"."organisationId" IS NOT NULL), ARRAY[]::uuid[]) as "organisationIds"'
      ),
    ])
    .where("user.id", userId)
    .first();

  return user;
};

export default getUserById;
