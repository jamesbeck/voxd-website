import db from "../database/db";

const getUserById = async ({ userId }: { userId: string }) => {
  const user = await db("user").where("id", userId).first();
  return user;
};

export default getUserById;
