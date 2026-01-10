import db from "../database/db";

const getAdminUserById = async ({ adminUserId }: { adminUserId: string }) => {
  const user = await db("adminUser")
    .select("adminUser.*")
    .where("adminUser.id", adminUserId)
    .first();

  return user;
};

export default getAdminUserById;
