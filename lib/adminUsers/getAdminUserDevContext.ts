import db from "@/database/db";
import { getEffectivePartnerBrandingMap } from "@/lib/getEffectivePartnerBranding";

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
      db.raw(
        'COALESCE(organisation.partner, false) as "organisationIsPartner"',
      ),
      "organisation.domain as organisationDomain",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      db.raw(
        'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
      ),
      "organisationPartner.id as organisationPartnerId",
    );
}

function getEffectivePartnerId(row: AdminUserDevContextRow) {
  return row.organisationIsPartner
    ? row.organisationId
    : row.organisationPartnerId;
}

function mapAdminUserDevContextRow({
  row,
  effectivePartnerName,
  effectivePartnerDomain,
  effectivePartnerOrganisationId,
  effectivePartnerOrganisationLogoFileExtension,
  effectivePartnerOrganisationShowLogoOnColour,
}: {
  row: AdminUserDevContextRow;
  effectivePartnerName: string | null;
  effectivePartnerDomain: string | null;
  effectivePartnerOrganisationId: string | null;
  effectivePartnerOrganisationLogoFileExtension: string | null;
  effectivePartnerOrganisationShowLogoOnColour: string | null;
}): AdminUserDevContext {
  const effectivePartnerId = getEffectivePartnerId(row);

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

export async function mapAdminUserDevContexts(
  rows: AdminUserDevContextRow[],
): Promise<AdminUserDevContext[]> {
  const effectivePartnerIds = Array.from(
    new Set(
      rows
        .map((row) => getEffectivePartnerId(row))
        .filter((partnerId): partnerId is string => !!partnerId),
    ),
  );
  const effectiveBrandingMap = await getEffectivePartnerBrandingMap({
    partnerIds: effectivePartnerIds,
  });

  return rows.map((row) => {
    const effectivePartnerId = getEffectivePartnerId(row);
    const effectiveBranding = effectivePartnerId
      ? effectiveBrandingMap[effectivePartnerId]
      : null;

    return mapAdminUserDevContextRow({
      row,
      effectivePartnerName: effectiveBranding?.name ?? null,
      effectivePartnerDomain: effectiveBranding?.domain ?? null,
      effectivePartnerOrganisationId:
        effectiveBranding?.sourceOrganisationId ?? null,
      effectivePartnerOrganisationLogoFileExtension:
        effectiveBranding?.logoFileExtension ?? null,
      effectivePartnerOrganisationShowLogoOnColour:
        effectiveBranding?.showLogoOnColour ?? null,
    });
  });
}

export async function getAdminUserDevContextById(adminUserId: string) {
  const row = (await getAdminUserDevContextBaseQuery()
    .where("adminUser.id", adminUserId)
    .first()) as AdminUserDevContextRow | undefined;

  if (!row) {
    return null;
  }

  const [context] = await mapAdminUserDevContexts([row]);

  return context ?? null;
}
