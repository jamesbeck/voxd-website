import db from "../database/db";

const getCustomerById = async ({
  customerId,
}: {
  customerId: string;
}): Promise<{
  id: string;
  name: string;
  userIds?: string[];
}> => {
  const customer = await db("customer")
    .leftJoin("customerUser", "customer.id", "customerUser.customerId")
    .groupBy("customer.id")
    .select("customer.*")
    .select([
      db.raw(
        'COALESCE(ARRAY_AGG("customerUser"."userId") FILTER (WHERE "customerUser"."userId" IS NOT NULL), ARRAY[]::uuid[]) as "userIds"'
      ),
    ])
    .where("customer.id", customerId)
    .first();
  return customer;
};

export default getCustomerById;
