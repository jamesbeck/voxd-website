import db from "../database/db";

const getChatUserById = async ({ userId }: { userId: string }) => {
  const user = await db("user")
    .groupBy("user.id")
    .select("user.*")
    .where("user.id", userId)
    .first();

  return user;
};

export default getChatUserById;
