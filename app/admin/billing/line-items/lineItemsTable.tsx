"use client";

import DataTable from "@/components/adminui/Table";
import TableActions from "@/components/admin/TableActions";
import TableLink from "@/components/adminui/TableLink";
import saGetInvoiceLineItemTableData from "@/actions/saGetInvoiceLineItemTableData";
import { format } from "date-fns";

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "-";

  return format(new Date(value), "dd/MM/yyyy");
};

const formatMoney = (value: number | null | undefined) => {
  if (value == null) return "-";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value / 100);
};

const formatVat = (value: number | null | undefined) => {
  if (value == null) return "-";

  return `${value}%`;
};

export default function LineItemsTable({
  invoiceId,
  fromPartnerId,
  toOrganisationId,
  toPartnerId,
  unsentOnly,
  tableId = "admin-billing-line-items",
}: {
  invoiceId?: string;
  fromPartnerId?: string;
  toOrganisationId?: string;
  toPartnerId?: string | null;
  unsentOnly?: boolean;
  tableId?: string;
}) {
  const columns = [
    {
      label: "Description",
      name: "description",
      sort: true,
      linkTo: (row: any) => `/admin/billing/line-items/${row.id}`,
    },
    {
      label: "From Partner",
      name: "fromPartnerName",
      sort: true,
      format: (row: any) => (
        <TableLink href={`/admin/organisations/${row.fromPartnerId}`}>
          {row.fromPartnerName || row.fromPartnerId}
        </TableLink>
      ),
    },
    {
      label: "To Organisation",
      name: "toOrganisationName",
      sort: true,
      format: (row: any) => (
        <TableLink href={`/admin/organisations/${row.toOrganisationId}`}>
          {row.toOrganisationName || row.toOrganisationId}
        </TableLink>
      ),
    },
    {
      label: "To Partner",
      name: "toPartnerName",
      sort: true,
      format: (row: any) =>
        row.toPartnerId ? (
          <TableLink href={`/admin/organisations/${row.toPartnerId}`}>
            {row.toPartnerName || row.toPartnerId}
          </TableLink>
        ) : (
          "-"
        ),
    },
    {
      label: "Agent",
      name: "agentName",
      sort: true,
      format: (row: any) => (
        <TableLink href={`/admin/agents/${row.agentId}`}>
          {row.agentNiceName || row.agentName}
        </TableLink>
      ),
    },
    {
      label: "Invoice",
      name: "invoiceNumber",
      sort: true,
      format: (row: any) =>
        row.invoiceId ? (
          <TableLink href={`/admin/billing/invoices/${row.invoiceId}`}>
            #{row.invoiceNumber}
          </TableLink>
        ) : (
          "-"
        ),
    },
    {
      label: "Service From",
      name: "serviceFromDate",
      sort: true,
      format: (row: any) => formatDate(row.serviceFromDate),
    },
    {
      label: "Service To",
      name: "serviceToDate",
      sort: true,
      format: (row: any) => formatDate(row.serviceToDate),
    },
    {
      label: "Quantity",
      name: "quantity",
      sort: true,
    },
    {
      label: "Amount",
      name: "amount",
      sort: true,
      format: (row: any) => formatMoney(row.amount),
    },
    {
      label: "VAT",
      name: "VAT",
      sort: true,
      format: (row: any) => formatVat(row.VAT),
    },
  ];

  return (
    <DataTable
      tableId={tableId}
      defaultSort={{
        name: "serviceFromDate",
        direction: "desc",
      }}
      getData={saGetInvoiceLineItemTableData}
      getDataParams={{
        invoiceId,
        fromPartnerId,
        toOrganisationId,
        toPartnerId,
        unsentOnly,
      }}
      columns={columns}
      actions={(row: any) => (
        <TableActions href={`/admin/billing/line-items/${row.id}`} />
      )}
    />
  );
}
