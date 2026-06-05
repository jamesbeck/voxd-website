export type PendingInvoiceGrouping = {
  fromPartnerId: string;
  toOrganisationId?: string | null;
  toPartnerId?: string | null;
};

export const isPartnerToPartnerPendingInvoice = ({
  toPartnerId,
}: Pick<PendingInvoiceGrouping, "toPartnerId">) => Boolean(toPartnerId);

export const getPendingInvoiceId = ({
  fromPartnerId,
  toOrganisationId,
  toPartnerId,
}: PendingInvoiceGrouping) => {
  if (toPartnerId) {
    return `pending:${fromPartnerId}:partner:${toPartnerId}`;
  }

  if (!toOrganisationId) {
    throw new Error(
      "Pending partner-to-organisation invoices require a destination organisation",
    );
  }

  return `pending:${fromPartnerId}:organisation:${toOrganisationId}`;
};

export const getPendingInvoiceSearchParams = ({
  fromPartnerId,
  toOrganisationId,
  toPartnerId,
}: PendingInvoiceGrouping) => {
  const params = new URLSearchParams({ fromPartnerId });

  if (toPartnerId) {
    params.set("toPartnerId", toPartnerId);
  } else if (toOrganisationId) {
    params.set("toOrganisationId", toOrganisationId);
  }

  return params;
};
