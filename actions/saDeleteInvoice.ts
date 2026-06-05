"use server";

import db from "@/database/db";
import { addLog } from "@/lib/addLog";
import {
  canMutateBillingRecords,
  userCanViewInvoice,
} from "@/lib/billingAccess";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saDeleteInvoice = async ({
  invoiceId,
}: {
  invoiceId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await canMutateBillingRecords({ accessToken }))) {
    return {
      success: false,
      error: "You do not have permission to delete invoices",
    };
  }

  if (!(await userCanViewInvoice({ invoiceId, accessToken }))) {
    return {
      success: false,
      error: "Invoice not found",
    };
  }

  await db("invoice").where({ id: invoiceId }).delete();

  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "INVOICE_DELETED",
    data: { invoiceId },
  });

  return { success: true };
};

export default saDeleteInvoice;
