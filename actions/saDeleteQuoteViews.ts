"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { addLog } from "@/lib/addLog";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewQuote from "@/lib/quoteAccess";

const saDeleteQuoteViews = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<ServerActionResponse> => {
  try {
    const accessToken = await verifyAccessToken();

    if (!(await userCanViewQuote({ quoteId, accessToken }))) {
      return {
        success: false,
        error: "Quote not found",
      };
    }

    const deletedCount = await db("quoteView").delete().where({ quoteId });

    await addLog({
      event: "Quote Views Deleted",
      description: `Deleted ${deletedCount} view(s) for quote ${quoteId}`,
      adminUserId: accessToken.adminUserId,
      data: {
        quoteId,
        deletedCount,
      },
    });

    return { success: true, data: { deletedCount } };
  } catch {
    return { success: false, error: "Error deleting quote views" };
  }
};

export default saDeleteQuoteViews;
