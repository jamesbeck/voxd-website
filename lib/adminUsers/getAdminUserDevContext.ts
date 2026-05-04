import db from "@/database/db";

export type AdminUserDevContext = {
  id: string;
  name: string | null;
  email: string | null;
  superAdmin: boolean;
  partnerId: string | null;
  organisationId: string | null;
  organisationName: string | null;
  organisationIsPartner: boolean;
  organisationLogoFileExtension: string | null;
  organisationShowLogoOnColour: string | null;
  effectivePartnerId: string | null;
  effectivePartnerName: string | null;
  effectivePartnerDomain: string | null;
  effectivePartnerOrganisationId: string | null;
  effectivePartnerOrganisationLogoFileExtension: string | null;
  effectivePartnerOrganisationShowLogoOnColour: string | null;
};

type AdminUserDevContextRow = {
  id: string;
  name: string | null;
  email: string | null;
  superAdmin: boolean;
  organisationId: string | null;
  organisationName: string | null;
  organisationIsPartner: boolean;
  organisationDomain: string | null;
  organisationLogoFileExtension: string | null;
  organisationShowLogoOnColour: string | null;
  organisationPartnerId: string | null;
  organisationPartnerName: string | null;
  organisationPartnerDomain: string | null;
  organisationPartnerLogoFileExtension: string | null;
  organisationPartnerShowLogoOnColour: string | null;
};

export function getAdminUserDevContextBaseQuery() {
  return db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .leftJoin(
      { organisationPartner: "organisation" },
      "organisation.partnerId",
      "organisationPartner.id",
    )
    .select(
      "adminUser.id",
      "adminUser.name",
      "adminUser.email",
      "adminUser.superAdmin",
      "adminUser.organisationId",
      "organisation.name as organisationName",
      db.raw('COALESCE(organisation.partner, false) as "organisationIsPartner"'),
      "organisation.domain as organisationDomain",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      db.raw(
        'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
      ),
      "organisationPartner.id as organisationPartnerId",
      "organisationPartner.name as organisationPartnerName",
      "organisationPartner.domain as organisationPartnerDomain",
      db.raw(
        '"organisationPartner"."logoFileExtension" as "organisationPartnerLogoFileExtension"',
      ),
      db.raw(
        '"organisationPartner"."showLogoOnColour" as "organisationPartnerShowLogoOnColour"',
      ),
    );
}

export function mapAdminUserDevContext(
  row: AdminUserDevContextRow,
): AdminUserDevContext {
  const effectivePartnerId = row.organisationIsPartner
    ? row.organisationId
    : row.organisationPartnerId;
  const effectivePartnerName = row.organisationIsPartner
    ? row.organisationName
    : row.organisationPartnerName;
  const effectivePartnerDomain = row.organisationIsPartner
    ? row.organisationDomain
    : row.organisationPartnerDomain;
  const effectivePartnerOrganisationId = effectivePartnerId;
  const effectivePartnerOrganisationLogoFileExtension = row.organisationIsPartner
    ? row.organisationLogoFileExtension
    : row.organisationPartnerLogoFileExtension;
  const effectivePartnerOrganisationShowLogoOnColour = row.organisationIsPartner
    ? row.organisationShowLogoOnColour
    : row.organisationPartnerShowLogoOnColour;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    superAdmin: row.superAdmin,
    partnerId: effectivePartnerId,
    organisationId: row.organisationId,
    organisationName: row.organisationName,
    organisationIsPartner: row.organisationIsPartner,
    organisationLogoFileExtension: row.organisationLogoFileExtension,
    organisationShowLogoOnColour: row.organisationShowLogoOnColour,
    effectivePartnerId,
    effectivePartnerName,
    effectivePartnerDomain,
    effectivePartnerOrganisationId,
    effectivePartnerOrganisationLogoFileExtension,
    effectivePartnerOrganisationShowLogoOnColour,
  };
}

export async function getAdminUserDevContextById(adminUserId: string) {
  const row = (await getAdminUserDevContextBaseQuery()
    .where("adminUser.id", adminUserId)
    .first()) as AdminUserDevContextRow | undefined;

  if (!row) {
    return null;
  }

  return mapAdminUserDevContext(row);
}
