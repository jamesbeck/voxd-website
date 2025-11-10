import db from "../database/db";

const getOrganisationById = async ({
  organisationId,
}: {
  organisationId: string;
}): Promise<{
  id: string;
  name: string;
  userIds?: string[];
}> => {
  const organisation = await db("organisation")
    .leftJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .groupBy("organisation.id")
    .select("organisation.*")
    .select([
      db.raw(
        'COALESCE(ARRAY_AGG("organisationUser"."userId") FILTER (WHERE "organisationUser"."userId" IS NOT NULL), ARRAY[]::uuid[]) as "userIds"'
      ),
    ])
    .where("organisation.id", organisationId)
    .first();
  return organisation;
};

export default getOrganisationById;
