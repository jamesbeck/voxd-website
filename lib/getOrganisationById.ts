import db from "../database/db";

const getOrganisationById = async ({
  organisationId,
}: {
  organisationId: string;
}): Promise<{
  id: string;
  name: string;
  partnerId?: string;
  adminUserIds?: string[];
  webAddress?: string;
  about?: string;
  logoFileExtension?: string;
  logoDarkBackground?: boolean;
}> => {
  const organisation = await db("organisation")
    .leftJoin("adminUser", "organisation.id", "adminUser.organisationId")
    .groupBy("organisation.id")
    .select("organisation.*")
    .select([
      db.raw(
        'COALESCE(ARRAY_AGG("adminUser"."id") FILTER (WHERE "adminUser"."id" IS NOT NULL), ARRAY[]::uuid[]) as "adminUserIds"'
      ),
    ])
    .where("organisation.id", organisationId)
    .first();

  return organisation;
};

export default getOrganisationById;
