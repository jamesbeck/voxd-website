"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  canAccessBillingPages,
  applyInvoiceLineItemReadScope,
  applyInvoiceReadScope,
} from "@/lib/billingAccess";
import { getPendingInvoiceId } from "@/lib/pendingInvoiceGrouping";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

type InvoiceTableRow = {
  id: string;
  number: number | null;
  invoiceDate: string | Date | null;
  dueDate: string | Date | null;
  totalExVat: number;
  toOrganisationId: string | null;
  fromPartnerId: string;
  toPartnerId: string | null;
  toOrganisationName: string | null;
  fromPartnerName: string | null;
  toPartnerName: string | null;
  gcPaymentID: string | null;
  gcStatus: string | null;
  gcChargeDate: string | Date | null;
  sent: boolean;
  isPlaceholder: boolean;
};

const PENDING_INVOICE_ORGANISATION_ID_SQL =
  'CASE WHEN "invoiceLineItem"."toPartnerId" IS NULL THEN "invoiceLineItem"."toOrganisationId" ELSE NULL END';

const PENDING_INVOICE_ORGANISATION_NAME_SQL =
  'CASE WHEN "invoiceLineItem"."toPartnerId" IS NULL THEN "toOrganisation"."name" ELSE NULL END';

const normalizeSortValue = (value: unknown) => {
  if (value == null) return null;

  if (value instanceof Date) return value.getTime();

  if (typeof value === "string") {
    const dateValue = Date.parse(value);

    if (!Number.isNaN(dateValue) && /\d{4}-\d{2}-\d{2}|T/.test(value)) {
      return dateValue;
    }

    return value.toLowerCase();
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
};

const compareRows = (
  left: InvoiceTableRow,
  right: InvoiceTableRow,
  sortField: string,
  sortDirection: "asc" | "desc",
) => {
  const leftValue = normalizeSortValue(
    left[sortField as keyof InvoiceTableRow],
  );
  const rightValue = normalizeSortValue(
    right[sortField as keyof InvoiceTableRow],
  );

  if (leftValue == null && rightValue == null) {
    return 0;
  }

  if (leftValue == null) {
    return 1;
  }

  if (rightValue == null) {
    return -1;
  }

  if (leftValue < rightValue) {
    return sortDirection === "asc" ? -1 : 1;
  }

  if (leftValue > rightValue) {
    return sortDirection === "asc" ? 1 : -1;
  }

  return 0;
};

const saGetInvoiceTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "invoiceDate",
  sortDirection = "desc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await canAccessBillingPages({ accessToken }))) {
    return { success: false, error: "Unauthorized" };
  }

  const invoiceBase = db("invoice")
    .leftJoin(
      "organisation as toOrganisation",
      "toOrganisation.id",
      "invoice.toOrganisationId",
    )
    .leftJoin(
      "organisation as fromPartnerOrganisation",
      "fromPartnerOrganisation.id",
      "invoice.fromPartnerId",
    )
    .leftJoin(
      "organisation as toPartnerOrganisation",
      "toPartnerOrganisation.id",
      "invoice.toPartnerId",
    )
    .where((qb) => {
      if (search) {
        qb.where("toOrganisation.name", "ilike", `%${search}%`)
          .orWhere("fromPartnerOrganisation.name", "ilike", `%${search}%`)
          .orWhere("toPartnerOrganisation.name", "ilike", `%${search}%`)
          .orWhere("invoice.gcStatus", "ilike", `%${search}%`)
          .orWhere("invoice.gcPaymentID", "ilike", `%${search}%`);

        const searchNumber = Number(search);
        if (!Number.isNaN(searchNumber)) {
          qb.orWhere("invoice.number", searchNumber);
        }
      }
    });

  await applyInvoiceReadScope({
    query: invoiceBase,
    accessToken,
  });

  const invoices = await invoiceBase
    .clone()
    .select(
      "invoice.*",
      "toOrganisation.name as toOrganisationName",
      "fromPartnerOrganisation.name as fromPartnerName",
      "toPartnerOrganisation.name as toPartnerName",
      db.raw(`(
        SELECT COALESCE(SUM("invoiceLineItem"."amount"), 0)::int
        FROM "invoiceLineItem"
        WHERE "invoiceLineItem"."invoiceId" = "invoice"."id"
      ) as "totalExVat"`),
    )
    .then((rows) =>
      rows.map<InvoiceTableRow>((row) => ({
        ...row,
        totalExVat: row.totalExVat ?? 0,
        sent: true,
        isPlaceholder: false,
      })),
    );

  const pendingInvoiceBase = db("invoiceLineItem")
    .leftJoin(
      "organisation as toOrganisation",
      "toOrganisation.id",
      "invoiceLineItem.toOrganisationId",
    )
    .leftJoin(
      "organisation as fromPartnerOrganisation",
      "fromPartnerOrganisation.id",
      "invoiceLineItem.fromPartnerId",
    )
    .leftJoin(
      "organisation as toPartnerOrganisation",
      "toPartnerOrganisation.id",
      "invoiceLineItem.toPartnerId",
    )
    .whereNull("invoiceLineItem.invoiceId")
    .where((qb) => {
      if (search) {
        qb.where("toOrganisation.name", "ilike", `%${search}%`)
          .orWhere("fromPartnerOrganisation.name", "ilike", `%${search}%`)
          .orWhere("toPartnerOrganisation.name", "ilike", `%${search}%`)
          .orWhere("invoiceLineItem.description", "ilike", `%${search}%`);
      }
    });

  await applyInvoiceLineItemReadScope({
    query: pendingInvoiceBase,
    accessToken,
  });

  const pendingInvoices = await pendingInvoiceBase
    .clone()
    .groupBy(
      "invoiceLineItem.fromPartnerId",
      "invoiceLineItem.toPartnerId",
      "fromPartnerOrganisation.name",
      "toPartnerOrganisation.name",
    )
    .groupByRaw(PENDING_INVOICE_ORGANISATION_ID_SQL)
    .groupByRaw(PENDING_INVOICE_ORGANISATION_NAME_SQL)
    .select(
      "invoiceLineItem.fromPartnerId",
      db.raw(`${PENDING_INVOICE_ORGANISATION_ID_SQL} as "toOrganisationId"`),
      "invoiceLineItem.toPartnerId",
      db.raw(
        `${PENDING_INVOICE_ORGANISATION_NAME_SQL} as "toOrganisationName"`,
      ),
      "fromPartnerOrganisation.name as fromPartnerName",
      "toPartnerOrganisation.name as toPartnerName",
      db.raw(
        'COALESCE(SUM("invoiceLineItem"."amount"), 0)::int as "totalExVat"',
      ),
    )
    .then((rows) =>
      rows.map<InvoiceTableRow>((row) => ({
        id: getPendingInvoiceId({
          fromPartnerId: row.fromPartnerId,
          toOrganisationId: row.toOrganisationId,
          toPartnerId: row.toPartnerId,
        }),
        number: null,
        invoiceDate: null,
        dueDate: null,
        totalExVat: row.totalExVat ?? 0,
        toOrganisationId: row.toOrganisationId || null,
        fromPartnerId: row.fromPartnerId,
        toPartnerId: row.toPartnerId || null,
        toOrganisationName: row.toOrganisationName || null,
        fromPartnerName: row.fromPartnerName || null,
        toPartnerName: row.toPartnerName || null,
        gcPaymentID: null,
        gcStatus: null,
        gcChargeDate: null,
        sent: false,
        isPlaceholder: true,
      })),
    );

  const mergedRows = [...invoices, ...pendingInvoices]
    .sort((left, right) => compareRows(left, right, sortField, sortDirection))
    .slice((page - 1) * pageSize, page * pageSize);

  const totalAvailable = invoices.length + pendingInvoices.length;

  return {
    success: true,
    data: mergedRows,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetInvoiceTableData;
