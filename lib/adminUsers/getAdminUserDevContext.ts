import db from "@/database/db";

export type AdminUserDevContext = {
  id: string;
  name: string | null;
  email: string | null;
  superAdmin: boolean;
  partnerId: string | null;
  organisationId: string | null;
  organisationName: string | null;
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
  partnerId: string | null;
  organisationId: string | null;
  organisationName: string | null;
  organisationLogoFileExtension: string | null;
  organisationShowLogoOnColour: string | null;
  directPartnerId: string | null;
  directPartnerName: string | null;
  directPartnerDomain: string | null;
  directPartnerOrganisationId: string | null;
  directPartnerOrganisationLogoFileExtension: string | null;
  directPartnerOrganisationShowLogoOnColour: string | null;
  organisationPartnerId: string | null;
  organisationPartnerName: string | null;
  organisationPartnerDomain: string | null;
  organisationPartnerOrganisationId: string | null;
  organisationPartnerOrganisationLogoFileExtension: string | null;
  organisationPartnerOrganisationShowLogoOnColour: string | null;
};

export function getAdminUserDevContextBaseQuery() {
  return db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .leftJoin(
      { directPartner: "partner" },
      "adminUser.partnerId",
      "directPartner.id",
    )
    .leftJoin(
      { organisationPartner: "partner" },
      "organisation.partnerId",
      "organisationPartner.id",
    )
    .leftJoin(
      { directPartnerOrganisation: "organisation" },
      "directPartner.organisationId",
      "directPartnerOrganisation.id",
    )
    .leftJoin(
      { organisationPartnerOrganisation: "organisation" },
      "organisationPartner.organisationId",
      "organisationPartnerOrganisation.id",
    )
    .select(
      "adminUser.id",
      "adminUser.name",
      "adminUser.email",
      "adminUser.superAdmin",
      "adminUser.partnerId",
      "adminUser.organisationId",
      "organisation.name as organisationName",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      db.raw(
        'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
      ),
      "directPartner.id as directPartnerId",
      "directPartner.name as directPartnerName",
      "directPartner.domain as directPartnerDomain",
      "directPartnerOrganisation.id as directPartnerOrganisationId",
      db.raw(
        '"directPartnerOrganisation"."logoFileExtension" as "directPartnerOrganisationLogoFileExtension"',
      ),
      db.raw(
        '"directPartnerOrganisation"."showLogoOnColour" as "directPartnerOrganisationShowLogoOnColour"',
      ),
      "organisationPartner.id as organisationPartnerId",
      "organisationPartner.name as organisationPartnerName",
      "organisationPartner.domain as organisationPartnerDomain",
      "organisationPartnerOrganisation.id as organisationPartnerOrganisationId",
      db.raw(
        '"organisationPartnerOrganisation"."logoFileExtension" as "organisationPartnerOrganisationLogoFileExtension"',
      ),
      db.raw(
        '"organisationPartnerOrganisation"."showLogoOnColour" as "organisationPartnerOrganisationShowLogoOnColour"',
      ),
    );
}

export function mapAdminUserDevContext(
  row: AdminUserDevContextRow,
): AdminUserDevContext {
  const effectivePartnerId = row.directPartnerId || row.organisationPartnerId;
  const effectivePartnerName =
    row.directPartnerName || row.organisationPartnerName;
  const effectivePartnerDomain =
    row.directPartnerDomain || row.organisationPartnerDomain;
  const effectivePartnerOrganisationId =
    row.directPartnerOrganisationId || row.organisationPartnerOrganisationId;
  const effectivePartnerOrganisationLogoFileExtension =
    row.directPartnerOrganisationLogoFileExtension ||
    row.organisationPartnerOrganisationLogoFileExtension;
  const effectivePartnerOrganisationShowLogoOnColour =
    row.directPartnerOrganisationShowLogoOnColour ||
    row.organisationPartnerOrganisationShowLogoOnColour;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    superAdmin: row.superAdmin,
    partnerId: row.partnerId,
    organisationId: row.organisationId,
    organisationName: row.organisationName,
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
