"use server";

import db from "@/database/db";
import { addLog } from "@/lib/addLog";
import {
  canMutateBillingRecords,
  userCanViewInvoiceLineItem,
} from "@/lib/billingAccess";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saDeleteInvoiceLineItem = async ({
  lineItemId,
}: {
  lineItemId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await canMutateBillingRecords({ accessToken }))) {
    return {
      success: false,
      error: "You do not have permission to delete line items",
    };
  }

  if (!(await userCanViewInvoiceLineItem({ lineItemId, accessToken }))) {
    return {
      success: false,
      error: "Line item not found",
    };
  }

  await db("invoiceLineItem").where({ id: lineItemId }).delete();

  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "INVOICE_LINE_ITEM_DELETED",
    data: { lineItemId },
  });

  return { success: true };
};

export default saDeleteInvoiceLineItem;
