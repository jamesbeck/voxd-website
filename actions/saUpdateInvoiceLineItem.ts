"use server";

import db from "@/database/db";
import { addLog } from "@/lib/addLog";
import {
  canMutateBillingRecords,
  userCanViewInvoiceLineItem,
} from "@/lib/billingAccess";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const emptyToNull = (value?: string | null) => {
  const trimmedValue = value?.trim() || "";

  return trimmedValue === "" ? null : trimmedValue;
};

const saUpdateInvoiceLineItem = async ({
  lineItemId,
  invoiceId,
  agentId,
  toOrganisationId,
  fromPartnerId,
  toPartnerId,
  serviceFromDate,
  serviceToDate,
  quantity,
  description,
  amount,
  VAT,
}: {
  lineItemId: string;
  invoiceId?: string;
  agentId: string;
  toOrganisationId: string;
  fromPartnerId: string;
  toPartnerId?: string;
  serviceFromDate: string;
  serviceToDate: string;
  quantity: string;
  description: string;
  amount: number;
  VAT: number;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await canMutateBillingRecords({ accessToken }))) {
    return {
      success: false,
      error: "You do not have permission to update line items",
    };
  }

  if (!(await userCanViewInvoiceLineItem({ lineItemId, accessToken }))) {
    return {
      success: false,
      error: "Line item not found",
    };
  }

  await db("invoiceLineItem")
    .where({ id: lineItemId })
    .update({
      invoiceId: emptyToNull(invoiceId),
      agentId,
      toOrganisationId,
      fromPartnerId,
      toPartnerId: emptyToNull(toPartnerId),
      serviceFromDate,
      serviceToDate,
      quantity,
      description,
      amount,
      VAT,
    });

  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "INVOICE_LINE_ITEM_UPDATED",
    data: {
      lineItemId,
      invoiceId: emptyToNull(invoiceId),
      agentId,
      toOrganisationId,
      fromPartnerId,
      toPartnerId: emptyToNull(toPartnerId),
      serviceFromDate,
      serviceToDate,
      quantity,
      description,
      amount,
      VAT,
    },
  });

  return { success: true };
};

export default saUpdateInvoiceLineItem;
