import db from "../database/db";

const getUserById = async ({ userId }: { userId: string }) => {
  const user = await db("user")
    .leftJoin("customerUser", "user.id", "customerUser.userId")
    .groupBy("user.id")
    .select("user.*")
    .select([
      db.raw(
        'COALESCE(ARRAY_AGG("customerUser"."customerId") FILTER (WHERE "customerUser"."customerId" IS NOT NULL), ARRAY[]::uuid[]) as "customerIds"'
      ),
    ])
    .where("user.id", userId)
    .first();

  return user;
};

export default getUserById;
