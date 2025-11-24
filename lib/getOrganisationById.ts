import db from "../database/db";

const getOrganisationById = async ({
  organisationId,
}: {
  organisationId: string;
}): Promise<{
  id: string;
  name: string;
  adminUserIds?: string[];
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
        'COALESCE(ARRAY_AGG("organisationUser"."adminUserId") FILTER (WHERE "organisationUser"."adminUserId" IS NOT NULL), ARRAY[]::uuid[]) as "adminUserIds"'
      ),
    ])
    .where("organisation.id", organisationId)
    .first();

  console.log(organisation);

  return organisation;
};

export default getOrganisationById;
