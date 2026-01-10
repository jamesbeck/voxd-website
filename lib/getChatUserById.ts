import db from "../database/db";

const getChatUserById = async ({ userId }: { userId: string }) => {
  const user = await db("chatUser")
    .groupBy("chatUser.id")
    .select("chatUser.*")
    .where("chatUser.id", userId)
    .first();

  return user;
};

export default getChatUserById;
